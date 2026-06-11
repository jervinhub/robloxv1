/* ================================================
   ROBLOX UI CLONE — app.js
   ================================================ */

let state = {
  username: 'Eisso',
  displayName: 'Eisso',
  robux: 195201263,
  avatarUrl: '',
  bannerUrl: '',
};

let sendState = {
  recipientId: null,
  recipientUsername: '',
  recipientDisplayName: '',
  recipientAvatarUrl: '',
  joinedYear: '' ,
  amount: 200,
};

let searchDebounce = null;
let notifTimeout = null;
let currentSearchId = 0;

function fmt(n) { return Number(n).toLocaleString('en-US'); }

function updateAllBalances() {
  document.getElementById('navRobuxBalance').textContent = fmt(state.robux);
  document.getElementById('sendModalBalance').textContent = fmt(state.robux);
}

function updateProfile() {
  document.getElementById('topNavUsername').textContent = state.username;
  document.getElementById('sidebarUsername').textContent = state.username;
  const topAvatar = document.getElementById('topNavAvatar');
  const sideAvatar = document.getElementById('sidebarAvatar');
  if (state.avatarUrl) {
    topAvatar.src = state.avatarUrl; topAvatar.style.display = '';
    sideAvatar.src = state.avatarUrl; sideAvatar.style.display = '';
  } else {
    topAvatar.src = ''; topAvatar.style.display = 'none';
    sideAvatar.src = ''; sideAvatar.style.display = 'none';
  }
  const bannerImg = document.getElementById('bannerImage');
  const bannerDefault = document.getElementById('bannerDefault');
  if (state.bannerUrl) {
    bannerImg.src = state.bannerUrl;
    bannerImg.classList.remove('hidden');
    bannerDefault.classList.add('hidden');
  } else {
    bannerImg.classList.add('hidden');
    bannerDefault.classList.remove('hidden');
  }
  const bonusBannerImg = document.getElementById('bonusBannerImg');
  if (bonusBannerImg && state.bannerUrl) bonusBannerImg.src = state.bannerUrl;
  updateAllBalances();
}

function closeNotification() {
  document.getElementById('topNotification').classList.add('hidden');
}

function openSettings() {
  document.getElementById('settingsUsername').value = state.username;
  document.getElementById('settingsDisplayName').value = state.displayName;
  document.getElementById('settingsRobux').value = state.robux;
  document.getElementById('settingsAvatarUrl').value = state.avatarUrl;
  document.getElementById('settingsBannerUrl').value = state.bannerUrl;
  document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('settingsModal').classList.add('hidden');
}

function saveSettings() {
  state.username = document.getElementById('settingsUsername').value.trim() || 'Eisso';
  state.displayName = document.getElementById('settingsDisplayName').value.trim() || state.username;
  state.robux = Math.max(0, parseInt(document.getElementById('settingsRobux').value) || 0);
  state.avatarUrl = document.getElementById('settingsAvatarUrl').value.trim();
  state.bannerUrl = document.getElementById('settingsBannerUrl').value.trim();
  updateProfile();
  closeSettings();
}

function toggleFaq(el) { el.classList.toggle('open'); }

function openSendModal() {
  updateAllBalances();
  goToStep1();
  document.getElementById('sendModal').classList.remove('hidden');
  setTimeout(function() { document.getElementById('searchInput').focus(); }, 100);
}

function closeSendModal() {
  document.getElementById('sendModal').classList.add('hidden');
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').innerHTML = '';
  document.getElementById('searchResults').classList.add('hidden');
  document.getElementById('searchHint').classList.remove('hidden');
  sendState.amount = 200;
}

function goToStep1() { showStep('sendStep1'); }
function goToStep2() { showStep('sendStep2'); renderStep2(); }

function goToStep3() {
  if (!sendState.amount || sendState.amount < 1) { alert('Please enter a valid amount.'); return; }
  if (sendState.amount > state.robux) { alert("You don't have enough Robux!"); return; }
  document.getElementById('confirmDisplayName').textContent=sendState.recipientDisplayName||'';
  document.getElementById('confirmUsername').textContent='@'+sendState.recipientUsername;
  document.getElementById('confirmAmount').innerHTML='<img src="assets/robux-icon.png" style="width:22px;height:22px;vertical-align:middle;margin-right:6px">'+fmt(sendState.amount);

  var cA=document.getElementById('confirmAvatar');
  var cF=document.getElementById('confirmAvatarFallback');
  if(sendState.recipientAvatarUrl){
    cA.src=sendState.recipientAvatarUrl;
    cA.style.display='';
    cF.classList.add('hidden');
  }
  document.getElementById('confirmJoinedYear').textContent=sendState.joinedYear||'----';
  showStep('sendStepConfirm');
}
function proceedSend(){ showStep('sendStep3'); startSending(); }

function showStep(id) {
  ['sendStep1','sendStep2','sendStepConfirm','sendStep3','sendStep4'].forEach(function(s) {
    document.getElementById(s).classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
}

function renderStep2() {
  document.getElementById('recipientDisplayName').textContent = sendState.recipientDisplayName || sendState.recipientUsername;
  document.getElementById('recipientUsername').textContent = '@' + sendState.recipientUsername;
  var avatar = document.getElementById('recipientAvatar');
  var fallback = document.getElementById('recipientAvatarFallback');
  if (sendState.recipientAvatarUrl) {
    avatar.src = sendState.recipientAvatarUrl;
    avatar.style.display = '';
    fallback.classList.add('hidden');
    avatar.onerror = function() {
      avatar.style.display = 'none';
      fallback.classList.remove('hidden');
      fallback.textContent = (sendState.recipientDisplayName || '?')[0].toUpperCase();
    };
  } else {
    avatar.style.display = 'none';
    fallback.classList.remove('hidden');
    fallback.textContent = (sendState.recipientDisplayName || sendState.recipientUsername || '?')[0].toUpperCase();
  }
  updateAmountDisplay();
  setQuickActive(sendState.amount);
}

function updateAmountDisplay() {
  document.getElementById('amountDisplay').textContent = fmt(sendState.amount);
  document.getElementById('sendModalBalance').textContent = fmt(state.robux);
}

function selectAmount(n) {
  sendState.amount = n;
  updateAmountDisplay();
  setQuickActive(n);
  document.getElementById('customAmountInput').classList.add('hidden');
  document.getElementById('amountDisplayRow').classList.remove('hidden');
}

function setQuickActive(n) {
  document.querySelectorAll('.quick-btn').forEach(function(btn) {
    btn.classList.toggle('active', parseInt(btn.dataset.amount) === n);
  });
}

function focusCustomAmount() {
  document.getElementById('amountDisplayRow').classList.add('hidden');
  var input = document.getElementById('customAmountInput');
  input.classList.remove('hidden');
  input.value = sendState.amount || '';
  input.focus(); input.select();
}

function onCustomAmount(val) {
  var n = parseInt(val) || 0;
  sendState.amount = n;
  document.getElementById('amountDisplay').textContent = fmt(n);
  setQuickActive(n);
}

function blurCustomAmount() {
  var val = parseInt(document.getElementById('customAmountInput').value) || 200;
  sendState.amount = Math.max(1, val);
  document.getElementById('customAmountInput').classList.add('hidden');
  document.getElementById('amountDisplayRow').classList.remove('hidden');
  updateAmountDisplay();
  setQuickActive(sendState.amount);
}

function startSending() {
  var targetBalance = state.robux - sendState.amount;
  var steps = 60, duration = 2200;
  var stepDuration = duration / steps;
  var stepAmount = sendState.amount / steps;
  var step = 0;
  var balEl = document.getElementById('sendModalBalance');
  var interval = setInterval(function() {
    step++;
    var current = Math.max(targetBalance, state.robux - stepAmount * step);
    balEl.textContent = fmt(Math.round(current));
    if (step >= steps) {
      clearInterval(interval);
      state.robux = targetBalance;
      updateAllBalances();
      showSuccess();
    }
  }, stepDuration);
}

function showSuccess() {
  showStep('sendStep4');
  document.getElementById('successText').innerHTML =
    'You sent <strong>' + fmt(sendState.amount) + ' Robux</strong> to @' + sendState.recipientUsername;
  document.getElementById('notifAmount').textContent = fmt(sendState.amount);
  document.getElementById('notifRecipient').textContent = '@' + sendState.recipientUsername;
  setTimeout(function() {
    closeSendModal();
    document.getElementById('topNotification').classList.remove('hidden');
    if (notifTimeout) clearTimeout(notifTimeout);
    notifTimeout = setTimeout(closeNotification, 6000);
  }, 1500);
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function selectUser(id, username, displayName, avatarUrl, joinedYear) {
  sendState.recipientId = id;
  sendState.joinedYear = joinedYear || '';
  sendState.recipientUsername = username;
  sendState.recipientDisplayName = displayName;
  sendState.recipientAvatarUrl = avatarUrl;
  sendState.amount = 200;
  goToStep2();
}

// ══════════════════════════════════════════════════
//  SEARCH — calls /api/user/:username (exact match)
//  same as your working site
// ══════════════════════════════════════════════════
function onSearchInput(val) {
  clearTimeout(searchDebounce);
  var hint = document.getElementById('searchHint');
  var results = document.getElementById('searchResults');
  var trimmed = val.trim();

  if (trimmed.length < 3) {
    hint.classList.remove('hidden');
    results.classList.add('hidden');
    results.innerHTML = '';
    return;
  }

  hint.classList.add('hidden');
  results.classList.remove('hidden');
  results.innerHTML = '<div class="search-loading">Searching...</div>';

  searchDebounce = setTimeout(function() { doSearch(trimmed); }, 600);
}

async function doSearch(username) {
  var results = document.getElementById('searchResults');
  var searchId = ++currentSearchId;

  try {
    var resp = await fetch('/api/user/' + encodeURIComponent(username));

    if (searchId !== currentSearchId) return;

    if (!resp.ok) {
      results.innerHTML = '<div class="search-loading">User not found.</div>';
      return;
    }

    var user = await resp.json();
    if (searchId !== currentSearchId) return;

    if (!user || !user.id) {
      results.innerHTML = '<div class="search-loading">User not found.</div>';
      return;
    }

    var displayName = user.displayName || user.name || username;
    var initial = (displayName[0] || '?').toUpperCase();

    // Build card
    var item = document.createElement('div');
    item.className = 'search-result-item';
    item.style.cursor = 'pointer';
    item.dataset.avatarUrl = user.avatarUrl || '';

    // Avatar wrapper
    var avatarWrap = document.createElement('div');
    avatarWrap.style.cssText = 'position:relative;width:42px;height:42px;flex-shrink:0;';

    // Letter fallback shown first
    var fb = document.createElement('div');
    fb.style.cssText = 'width:42px;height:42px;border-radius:50%;background:#353535;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#ccc;';
    fb.textContent = initial;
    avatarWrap.appendChild(fb);

    // Avatar image on top
    if (user.avatarUrl) {
      var img = document.createElement('img');
      img.style.cssText = 'position:absolute;inset:0;width:42px;height:42px;border-radius:50%;object-fit:cover;display:none;';
      img.alt = '';
      img.onload = function() {
        img.style.display = 'block';
        fb.style.display = 'none';
      };
      img.onerror = function() {
        img.style.display = 'none';
        fb.style.display = 'flex';
      };
      img.src = user.avatarUrl;
      avatarWrap.appendChild(img);
    }

    // Name info
    var info = document.createElement('div');
    info.className = 'result-info';
    info.innerHTML =
      '<div class="result-display-name">' + escHtml(displayName) + '</div>' +
      '<div class="result-username">@' + escHtml(user.name) + '</div>';

    item.appendChild(avatarWrap);
    item.appendChild(info);

    item.onclick = function() {
      selectUser(user.id, user.name, displayName, user.avatarUrl || '', user.joinedYear || '');
    };

    results.innerHTML = '';
    results.appendChild(item);

  } catch (err) {
    if (searchId !== currentSearchId) return;
    results.innerHTML = '<div class="search-loading">User not found.</div>';
    console.error('doSearch error:', err);
  }
}

document.getElementById('settingsModal').addEventListener('click', function(e) {
  if (e.target === this) closeSettings();
});
document.getElementById('sendModal').addEventListener('click', function(e) {
  if (e.target === this) closeSendModal();
});

(function init() { updateProfile(); })();


let limitedItems=[];let limitedIndex=0;
async function loadLimitedItems(){
 try{
  const r=await fetch('/api/limited-items'); limitedItems=await r.json();
  renderLimitedItem();
  setInterval(()=>{limitedIndex=(limitedIndex+1)%limitedItems.length;renderLimitedItem();},5000);
 }catch(e){console.error(e);}
}
function renderLimitedItem(){
 if(!limitedItems.length)return;
 const i=limitedItems[limitedIndex];
 const img=document.getElementById('limitedImage');
 if(img) img.src=i.imageUrl||'';
 if(document.getElementById('limitedName')) document.getElementById('limitedName').textContent=i.name;
 if(document.getElementById('limitedRobux')) document.getElementById('limitedRobux').textContent=i.robux;
 if(document.getElementById('limitedOld')) document.getElementById('limitedOld').textContent=i.oldRobux;
 if(document.getElementById('limitedBonus')) document.getElementById('limitedBonus').textContent=i.bonus;
 if(document.getElementById('limitedPrice')) document.getElementById('limitedPrice').textContent=i.price;
}
loadLimitedItems();
