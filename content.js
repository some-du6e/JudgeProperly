const SCORE_CARD_SELECTOR = '#votes-score-card';
const SCORE_CARD_LABEL = 'Judge';
const VOTE_FORM_SELECTOR = '#vote-score-form';
const SUGGESTION_TOKEN_SELECTOR = '#suggestion_token';
const MAX_INIT_ATTEMPTS = 40;
const INIT_RETRY_DELAY_MS = 250;

let initAttempts = 0;
let restoreAppliedForKey = null;
let autosaveBound = false;
let saveTimerId = null;

function cancelPendingSave() {
  if (saveTimerId !== null) {
    window.clearTimeout(saveTimerId);
    saveTimerId = null;
  }
}

function getVoteForm() {
  const form = document.querySelector(VOTE_FORM_SELECTOR);
  return form instanceof HTMLFormElement ? form : null;
}

function decodeSuggestionToken(tokenValue) {
  if (!tokenValue) {
    return null;
  }

  const payload = tokenValue.split('--')[0];
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function getDraftStorageKey(form) {
  const suggestionToken = form.querySelector(SUGGESTION_TOKEN_SELECTOR);
  const tokenValue = suggestionToken instanceof HTMLInputElement ? suggestionToken.value : 'unknown';
  const decodedToken = decodeSuggestionToken(tokenValue);
  const stableId = decodedToken?.ship_event_id || decodedToken?.user_id || tokenValue || window.location.pathname;
  return `judgeproperly:votes:new:${stableId}`;
}

function collectDraft(form) {
  const draft = {};
  const fields = form.querySelectorAll('input[name^="vote["], textarea[name^="vote["]');

  for (const field of fields) {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
      continue;
    }

    if (field instanceof HTMLInputElement && field.type === 'hidden') {
      continue;
    }

    if (field instanceof HTMLInputElement && field.type === 'radio') {
      if (field.checked) {
        draft[field.name] = field.value;
      }
      continue;
    }

    draft[field.name] = field.value;
  }

  return draft;
}

async function saveDraft(form) {
  const draft = collectDraft(form);
  await chrome.storage.local.set({ [getDraftStorageKey(form)]: draft });
}

function queueDraftSave(form) {
  cancelPendingSave();
  saveTimerId = window.setTimeout(() => {
    saveTimerId = null;
    void saveDraft(form);
  }, 100);
}

function flushDraftSave(form) {
  cancelPendingSave();
  void saveDraft(form);
}

async function clearDraft(form) {
  await chrome.storage.local.remove(getDraftStorageKey(form));
}

async function restoreDraft(form) {
  const draftKey = getDraftStorageKey(form);
  const saved = await chrome.storage.local.get(draftKey);
  const draft = saved[draftKey];
  if (!draft || typeof draft !== 'object') {
    return;
  }

  for (const [name, value] of Object.entries(draft)) {
    if (typeof value !== 'string') {
      continue;
    }

    const radioField = form.querySelector(`input[type="radio"][name="${CSS.escape(name)}"][value="${CSS.escape(value)}"]`);
    if (radioField instanceof HTMLInputElement) {
      radioField.checked = true;
      radioField.dispatchEvent(new Event('change', { bubbles: true }));
      continue;
    }

    const textField = form.querySelector(`[name="${CSS.escape(name)}"]`);
    if (textField instanceof HTMLInputElement || textField instanceof HTMLTextAreaElement) {
      textField.value = value;
      textField.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}

function bindDraftPersistence(form) {
  if (form.dataset.judgeproperlyDraftBound === 'true') {
    return;
  }

  form.addEventListener('input', () => queueDraftSave(form));
  form.addEventListener('change', () => queueDraftSave(form));
  form.addEventListener('submit', () => flushDraftSave(form), true);

  form.dataset.judgeproperlyDraftBound = 'true';
}

function bindAutosaveListeners() {
  if (autosaveBound) {
    return;
  }

  const queueCurrentDraft = () => {
    const form = getVoteForm();
    if (form) {
      queueDraftSave(form);
    }
  };

  const flushCurrentDraft = () => {
    const form = getVoteForm();
    if (form) {
      flushDraftSave(form);
    }
  };

  document.addEventListener('input', queueCurrentDraft, true);
  document.addEventListener('change', queueCurrentDraft, true);
  document.addEventListener('submit', flushCurrentDraft, true);
  window.addEventListener('beforeunload', flushCurrentDraft);

  autosaveBound = true;
}

function updateScoreCardLabel() {
  const scoreCard = document.querySelector(SCORE_CARD_SELECTOR);
  if (!(scoreCard instanceof HTMLElement)) {
    return;
  }

  const toggleButton = scoreCard.querySelector('.votes-new__score-card-toggle');
  if (toggleButton instanceof HTMLButtonElement) {
    toggleButton.textContent = SCORE_CARD_LABEL;
  }
}

async function initializeVotePage() {
  updateScoreCardLabel();
  bindAutosaveListeners();

  const form = getVoteForm();
  if (!form) {
    if (initAttempts < MAX_INIT_ATTEMPTS) {
      initAttempts += 1;
      window.setTimeout(initializeVotePage, INIT_RETRY_DELAY_MS);
    }
    return;
  }

  const draftKey = getDraftStorageKey(form);
  if (restoreAppliedForKey !== draftKey) {
    await restoreDraft(form);
    restoreAppliedForKey = draftKey;
  }

  bindDraftPersistence(form);
}

if (window.location.hostname === 'flavortown.hackclub.com' && window.location.pathname.startsWith('/votes/new')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVotePage, { once: true });
  } else {
    initializeVotePage();
  }

  window.addEventListener('pageshow', initializeVotePage, { once: true });
}