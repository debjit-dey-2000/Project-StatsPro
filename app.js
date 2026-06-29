/* ===== VERSION GATE — kills ALL old data from previous broken versions ===== */
var VER_KEY='pp_v5';
(function versionGate(){
  if(localStorage.getItem(VER_KEY)!=='5'){
    // Remove every key that old versions used
    Object.keys(localStorage).forEach(function(k){
      if(k.indexOf('pp_')===0) localStorage.removeItem(k);
    });
    localStorage.setItem(VER_KEY,'5');
  }
})();

/* ===== CONSTANTS ===== */
var SK='pp_data',STK='pp_streak',EXP='pp_exp',UK='wts_users',SESS='wts_session',TK='wts_theme';
var ADMIN_EMAIL='debjitwts@gmail.com',ADMIN_PASS='Debjitdev@2026',OLD_ADMIN_EMAIL='admin@wts.local';
var COLORS=['#F5A623','#0ECB81','#3861FB','#F6465D','#A855F7','#EC4899','#14B8A6','#EF4444'];
var CAT_C={Development:'#3861FB',Design:'#A855F7',Marketing:'#F5A623',Research:'#14B8A6',Operations:'#EC4899',Personal:'#0ECB81'};
var FILTERS=[{key:'all',label:'All'},{key:'active',label:'Active'},{key:'completed',label:'Completed'},{key:'high',label:'High Priority'},{key:'archived',label:'Archived'}];
var projects=[],expanded=new Set(),delCb=null,curFilter='all',editTL=[],selColor=COLORS[0],users=[],currentUser=null,pendingVerifyEmail='',pendingResetEmail='';
var DEFAULT_PROJECT_NAMES=['Website Redesign','Mobile App MVP','Q1 Content Calendar','User Research Interviews'];

/* ===== SAFE HELPERS ===== */
function gid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function today(){return new Date().toISOString().split('T')[0]}
function $(id){return document.getElementById(id)}
function S(o,k,def){return(o!=null&&o[k]!=null)?o[k]:def}
function SPri(p){return S(p,'pri',S(p,'priority','medium'))}
function SDesc(p){return S(p,'desc',S(p,'description',''))}
function SCreated(p){return S(p,'created',S(p,'createdAt',today()))}
function THrs(t){var v=S(t,'hrs',S(t,'hours',1));return isNaN(v)?1:v}
function TNotes(t){return S(t,'notes','')}
function TLog(t){var l=S(t,'timeLog',[]);return Array.isArray(l)?l:[]}
function PCat(p){return S(p,'cat','Development')}
function PColor(p){return S(p,'color','#F5A623')}
function PArchived(p){return!!S(p,'archived',false)}
function PNotes(p){return S(p,'notes','')}
function isDone(p){var ts=S(p,'tasks',[]);return ts.length>0&&ts.every(function(t){return!!t.done})}
function pProg(p){var ts=S(p,'tasks',[]);if(!ts.length)return 0;return Math.round(ts.filter(function(t){return!!t.done}).length/ts.length*100)}

/* ===== MIGRATION ===== */
function migrateProject(p){
  if(p.priority!==undefined&&p.pri===undefined) p.pri=p.priority;
  if(p.description!==undefined&&p.desc===undefined) p.desc=p.description;
  if(p.createdAt!==undefined&&p.created===undefined) p.created=p.createdAt;
  if(p.cat===undefined) p.cat='Development';
  if(p.color===undefined) p.color=COLORS[Math.floor(Math.random()*COLORS.length)];
  if(p.archived===undefined) p.archived=false;
  if(p.notes===undefined) p.notes='';
  if(!Array.isArray(p.tasks)) p.tasks=[];
  p.tasks.forEach(function(t){
    if(t.priority!==undefined&&t.pri===undefined) t.pri=t.priority;
    if(t.hours!==undefined&&t.hrs===undefined) t.hrs=t.hours;
    if(t.notes===undefined) t.notes='';
    if(!Array.isArray(t.timeLog)) t.timeLog=[];
    if(t.created===undefined&&t.createdAt!==undefined) t.created=t.createdAt;
    if(t.created===undefined) t.created=today();
    if(t.hrs===undefined||isNaN(t.hrs)) t.hrs=1;
    if(t.pri===undefined) t.pri='medium';
    if(t.done===undefined) t.done=false;
  });
  return p;
}

/* ===== DATA ===== */
function loadData(){
  try{
    var raw=localStorage.getItem(SK);
    if(raw){projects=JSON.parse(raw);if(!Array.isArray(projects))projects=[];projects=projects.map(migrateProject)}
    else{projects=[]}
  }catch(e){console.warn('Load failed:',e);projects=[]}
  projects=projects.filter(function(p){return DEFAULT_PROJECT_NAMES.indexOf(S(p,'name',''))===-1});
  saveData();
}
function saveData(){
  try{localStorage.setItem(SK,JSON.stringify(projects));localStorage.setItem(EXP,JSON.stringify([].concat(expanded)));updateStreak()}
  catch(e){console.error('Save failed:',e)}
}

/* ===== STREAK ===== */
function updateStreak(){
  try{var sd=JSON.parse(localStorage.getItem(STK)||'{}'),t=today();if(projects.some(function(p){return S(p,'tasks',[]).some(function(tk){return tk.done&&TLog(tk).some(function(l){return l.date===t})})})){sd[t]=true}localStorage.setItem(STK,JSON.stringify(sd))}catch(e){}
}
function getStreak(){
  try{var sd=JSON.parse(localStorage.getItem(STK)||'{}'),s=0,d=new Date();if(!sd[today()])d.setDate(d.getDate()-1);while(true){var k=d.toISOString().split('T')[0];if(sd[k]){s++;d.setDate(d.getDate()-1)}else break}return s}catch(e){return 0}
}

/* ===== LIVE CLOCK ===== */
function updateClock(){
  var now=new Date();
  var h=String(now.getHours()).padStart(2,'0');
  var m=String(now.getMinutes()).padStart(2,'0');
  var s=String(now.getSeconds()).padStart(2,'0');
  ['liveClock','canvasLiveClock'].forEach(function(id){var el=$(id);if(el)el.textContent=h+':'+m+':'+s});
}
setInterval(updateClock,1000);
updateClock();

/* ===== TOAST ===== */
function toast(msg,type){
  type=type||'ok';
  var c=$('TC'),el=document.createElement('div');
  var ic={ok:'fa-check-circle',er:'fa-exclamation-circle',in:'fa-info-circle'};
  el.className='tst '+type;
  el.innerHTML='<i class="fa-solid '+(ic[type]||ic.in)+'"></i> '+msg;
  c.appendChild(el);
  setTimeout(function(){el.classList.add('tst-out');setTimeout(function(){el.remove()},250)},3000);
}

/* ===== THEME ===== */
function applyTheme(theme){
  var isLight=theme==='light';
  document.body.classList.toggle('light',isLight);
  localStorage.setItem(TK,isLight?'light':'dark');
  document.querySelectorAll('.theme-toggle').forEach(function(btn){btn.innerHTML='<i class="fa-solid fa-'+(isLight?'sun':'moon')+'"></i>'});
  if(window.Chart&&$('wC')&&$('pC')){renderWeekly();renderPriority()}
}
function toggleTheme(){
  applyTheme(document.body.classList.contains('light')?'dark':'light');
}
function chartTextColor(){return document.body.classList.contains('light')?'#4B5567':'#E2E3EB'}

/* ===== MODALS ===== */
function authLocked(){return document.body.classList.contains('auth-locked')&&!currentUser}
function openMo(id){$(id).classList.add('on');document.body.style.overflow='hidden'}
function closeMo(id){if(id==='authMo'&&authLocked())return;$(id).classList.remove('on');document.body.style.overflow=authLocked()?'hidden':''}
document.querySelectorAll('.mo').forEach(function(o){o.addEventListener('click',function(e){if(e.target===o){if(o.id==='authMo'&&authLocked())return;o.classList.remove('on');document.body.style.overflow=authLocked()?'hidden':''}})});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){document.querySelectorAll('.mo.on').forEach(function(m){if(m.id==='authMo'&&authLocked())return;m.classList.remove('on')});document.body.style.overflow=authLocked()?'hidden':'';closeSidebarCanvas()}});
function openSidebarCanvas(){
  var c=$('sidebarCanvas'),s=$('sidebarScrim');if(!c||!s)return;
  c.classList.add('on');s.classList.add('on');c.setAttribute('aria-hidden','false');
}
function closeSidebarCanvas(){
  var c=$('sidebarCanvas'),s=$('sidebarScrim');if(!c||!s)return;
  c.classList.remove('on');s.classList.remove('on');c.setAttribute('aria-hidden','true');
}

/* ===== AUTH ===== */
function loadUsers(){
  try{users=JSON.parse(localStorage.getItem(UK)||'[]');if(!Array.isArray(users))users=[]}catch(e){users=[]}
  var oldAdmin=users.find(function(u){return u.email===OLD_ADMIN_EMAIL&&u.role==='admin'});
  var existingAdmin=users.find(function(u){return u.email===ADMIN_EMAIL&&u.role==='admin'});
  if(oldAdmin&&existingAdmin){
    users=users.filter(function(u){return!(u.email===OLD_ADMIN_EMAIL&&u.role==='admin')});
  }else if(oldAdmin){
    oldAdmin.email=ADMIN_EMAIL;oldAdmin.password=ADMIN_PASS;oldAdmin.verified=true;oldAdmin.approved=true;
  }
  if(!users.some(function(u){return u.email===ADMIN_EMAIL})){
    users.push({id:gid(),email:ADMIN_EMAIL,password:ADMIN_PASS,role:'admin',verified:true,approved:true,created:today(),profile:{fullName:'Administrator',designation:'Site Administrator',photo:''}});
  }
  var admin=users.find(function(u){return u.email===ADMIN_EMAIL&&u.role==='admin'});
  if(admin){
    admin.password=ADMIN_PASS;admin.verified=true;admin.approved=true;
    saveUsers();
  }
  var sid=localStorage.getItem(SESS);
  currentUser=users.find(function(u){return u.id===sid})||null;
}
function saveUsers(){localStorage.setItem(UK,JSON.stringify(users))}
function authUser(email){email=String(email||'').trim().toLowerCase();return users.find(function(u){return u.email===email})}
function newCode(){return String(Math.floor(100000+Math.random()*900000))}
function userLabel(u){return S(S(u,'profile',{}),'fullName','')||u.email}
function userInitials(u){var n=userLabel(u).trim();return(n[0]||'U').toUpperCase()}
function isAdmin(){return currentUser&&currentUser.role==='admin'}
function setAuthError(msg){
  var el=$('authErr');if(!el)return;
  el.textContent=msg||'';el.classList.toggle('on',!!msg);
}
function lowercaseField(el){el.value=String(el.value||'').toLowerCase()}
function lettersOnly(el){el.value=String(el.value||'').replace(/[^A-Za-z ]/g,'').replace(/\s{2,}/g,' ')}
function digitsOnly(el){el.value=String(el.value||'').replace(/\D/g,'').slice(0,10)}
function validName(v){return/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(String(v||'').trim())}
function validEmail(v){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim())}
function validPhone(v){return/^\d{10}$/.test(String(v||''))}
function completeAuth(u,msg){
  currentUser=u;localStorage.setItem(SESS,u.id);renderAuthBar();applyAuthGate();toast(msg||'Logged in','ok');
}
function applyAuthGate(preferredMode){
  var locked=!currentUser;
  document.body.classList.toggle('auth-locked',locked);
  var shell=document.querySelector('.app-shell');
  if(shell)shell.setAttribute('aria-hidden',locked?'true':'false');
  if(locked){showAuthMode(preferredMode||'signup');document.body.style.overflow='hidden'}
  else{if($('authMo'))$('authMo').classList.remove('on');document.body.style.overflow=''}
}
function requireAuth(){
  if(currentUser)return true;
  toast('Please sign up or login first','in');
  applyAuthGate('signup');
  return false;
}
function renderAuthBar(){
  renderAuthTarget('authBar','');
  renderAuthTarget('railAuthBar','Rail');
  renderAuthTarget('canvasAuthBar','Canvas');
}
function renderAuthTarget(id,suffix){
  var bar=$(id);if(!bar)return;
  var btnId='userMenuBtn'+suffix,menuId='userMenu'+suffix;
  if(!currentUser){
    var accountLabel=suffix==='Canvas'?'<span>Account</span>':'';
    bar.innerHTML='<button class="user-trigger" id="'+btnId+'" data-suffix="'+suffix+'" onclick="toggleUserMenu(event,this.dataset.suffix)" aria-label="Account menu"><i class="fa-solid fa-user"></i>'+accountLabel+'<i class="fa-solid fa-chevron-down" style="font-size:10px;"></i></button>'
      +"<div class=\"user-dropdown\" id=\""+menuId+"\"><button class=\"user-dd-btn\" onclick=\"showAuthMode('login');closeUserMenu()\"><i class=\"fa-solid fa-right-to-bracket\"></i> Login</button><button class=\"user-dd-btn\" onclick=\"showAuthMode('signup');closeUserMenu()\"><i class=\"fa-solid fa-user-plus\"></i> Register</button></div>";
    return;
  }
  var photo=S(S(currentUser,'profile',{}),'photo','');
  var avatar=photo?'<img class="auth-avatar" src="'+photo+'" alt="">':'<span class="auth-avatar">'+userInitials(currentUser)+'</span>';
  bar.innerHTML='<button class="user-trigger" id="'+btnId+'" data-suffix="'+suffix+'" onclick="toggleUserMenu(event,this.dataset.suffix)" aria-label="Account menu">'+avatar+'<span>'+esc(userLabel(currentUser))+'</span><i class="fa-solid fa-chevron-down" style="font-size:10px;"></i></button>'
    +'<div class="user-dropdown" id="'+menuId+'"><div class="user-dd-head"><p class="user-dd-name">'+esc(userLabel(currentUser))+'</p><p class="user-dd-email">'+esc(currentUser.email)+'</p></div>'
    +(currentUser.role==='admin'?'<button class="user-dd-btn" onclick="openAdminPanel();closeUserMenu()"><i class="fa-solid fa-user-shield"></i> Admin</button>':'')
    +'<button class="user-dd-btn" onclick="openProfile();closeUserMenu()"><i class="fa-solid fa-id-card"></i> Profile</button>'
    +'<button class="user-dd-btn" onclick="logoutUser();closeUserMenu()"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</button></div>';
}
function toggleUserMenu(e,suffix){
  if(e)e.stopPropagation();
  closeUserMenu(suffix);
  var menu=$('userMenu'+(suffix||'')),btn=$('userMenuBtn'+(suffix||''));if(!menu||!btn)return;
  var on=menu.classList.toggle('on');btn.classList.toggle('on',on);
}
function closeUserMenu(exceptSuffix){
  ['','Rail','Canvas'].forEach(function(suffix){
    if(suffix===exceptSuffix)return;
    var menu=$('userMenu'+suffix),btn=$('userMenuBtn'+suffix);
    if(menu)menu.classList.remove('on');
    if(btn)btn.classList.remove('on');
  });
}
document.addEventListener('click',closeUserMenu);
function showAuthMode(mode){
  setAuthError('');
  ['loginForm','signupForm','verifyForm','forgotForm','resetForm'].forEach(function(id){$(id).classList.add('hidden')});
  if(mode==='signup'){$('authTitle').textContent='Create Account';$('signupForm').classList.remove('hidden')}
  else if(mode==='verify'){$('authTitle').textContent='Verify Email';$('verifyForm').classList.remove('hidden')}
  else if(mode==='forgot'){$('authTitle').textContent='Forgot Password';$('forgotForm').classList.remove('hidden')}
  else if(mode==='reset'){$('authTitle').textContent='Reset Password';$('resetForm').classList.remove('hidden')}
  else{$('authTitle').textContent='Login';$('loginForm').classList.remove('hidden')}
  openMo('authMo');
}
function submitSignup(e){
  e.preventDefault();
  var first=$('signupFirst').value.trim(),last=$('signupLast').value.trim(),designation=$('signupDesignation').value.trim();
  var email=$('signupEmail').value.trim().toLowerCase(),phone=$('signupPhone').value.trim(),country=$('signupCountry').value;
  $('signupEmail').value=email;
  if(!first||!last||!designation||!email||!phone){setAuthError('All Fields are Required.');return}
  if(!validName(first)||!validName(last)){setAuthError('First name and last name can contain letters only.');return}
  if(!validEmail(email)){setAuthError('Enter a valid lowercase email address.');return}
  if(!validPhone(phone)){setAuthError('Phone number must be exactly 10 numbers.');return}
  if(authUser(email)){setAuthError('Account already exists. Please login.');return}
  var fullName=first+' '+last;
  var u={id:gid(),email:email,password:phone,countryCode:country,phone:country+phone,role:'user',verified:true,approved:true,created:today(),profile:{firstName:first,lastName:last,fullName:fullName,designation:designation,countryCode:country,phone:country+phone,photo:''}};
  users.push(u);saveUsers();completeAuth(u,'Account created');
}
function submitVerification(e){
  e.preventDefault();
  var u=authUser(pendingVerifyEmail),code=$('verifyCode').value.trim();
  if(!u||u.code!==code){toast('Invalid verification code','er');return}
  u.verified=true;u.code='';saveUsers();showAuthMode('login');toast('Email verified. Waiting for admin approval.','in');
}
function submitLogin(e){
  e.preventDefault();
  var email=$('loginEmail').value.trim().toLowerCase(),pass=$('loginPass').value.trim();
  $('loginEmail').value=email;
  if(!email||!pass){setAuthError('All Fields are Required.');return}
  if(!validEmail(email)){setAuthError('Enter a valid lowercase email address.');return}
  var u=authUser(email),phonePass=pass.replace(/\D/g,'');
  if(!u||(u.password!==pass&&String(S(u,'phone','')).replace(/\D/g,'')!==phonePass)){setAuthError('Invalid email or password.');return}
  if(!u.verified){pendingVerifyEmail=u.email;$('verifyEmail').textContent=u.email;$('demoCodeBox').textContent=u.code||'------';showAuthMode('verify');toast('Verify your email first','in');return}
  if(!u.approved){setAuthError('Account is waiting for admin approval.');return}
  completeAuth(u,'Logged in');
  if(u.role!=='admin'&&(!S(u.profile,'fullName','')||!S(u.profile,'designation','')))openProfile();
}
function submitForgotPassword(e){
  e.preventDefault();
  var email=$('forgotEmail').value.trim().toLowerCase(),u=authUser(email);
  $('forgotEmail').value=email;
  if(!email){setAuthError('All Fields are Required.');return}
  if(!validEmail(email)){setAuthError('Enter a valid lowercase email address.');return}
  if(!u){setAuthError('No account found for that email.');return}
  u.resetCode=newCode();pendingResetEmail=email;saveUsers();
  $('resetEmail').textContent=email;$('resetCodeBox').textContent=u.resetCode;$('resetCode').value='';$('newPass').value='';
  showAuthMode('reset');toast('Password reset code generated','in');
}
function submitResetPassword(e){
  e.preventDefault();
  var u=authUser(pendingResetEmail),code=$('resetCode').value.trim(),pass=$('newPass').value;
  if(!u||u.resetCode!==code){toast('Invalid reset code','er');return}
  u.password=pass;u.resetCode='';saveUsers();pendingResetEmail='';
  showAuthMode('login');toast('Password updated. Please login.','ok');
}
function logoutUser(){currentUser=null;localStorage.removeItem(SESS);renderAuthBar();toast('Logged out','in');applyAuthGate('signup')}
function openProfile(){
  if(!requireAuth())return;
  $('profileEmail').textContent=currentUser.email;
  $('fullName').value=S(currentUser.profile,'fullName','');
  $('designation').value=S(currentUser.profile,'designation','');
  $('profilePreview').src=S(currentUser.profile,'photo','')||'';
  openMo('profileMo');
}
function previewProfilePic(e){
  var file=e.target.files&&e.target.files[0];if(!file)return;
  var r=new FileReader();
  r.onload=function(){ $('profilePreview').src=r.result };
  r.readAsDataURL(file);
}
function saveProfile(e){
  e.preventDefault();
  if(!currentUser)return;
  currentUser.profile=currentUser.profile||{};
  currentUser.profile.fullName=$('fullName').value.trim();
  currentUser.profile.designation=$('designation').value.trim();
  currentUser.profile.photo=$('profilePreview').src||'';
  saveUsers();renderAuthBar();closeMo('profileMo');toast('Profile saved');
}
function openAdminPanel(){
  if(!isAdmin()){toast('Admin access only','er');return}
  renderAdminUsers();openMo('adminMo');
}
function approveUser(id){
  var u=users.find(function(x){return x.id===id});if(!u)return;
  u.approved=true;saveUsers();renderAdminUsers();toast('User approved');
}
function rejectUser(id){
  var u=users.find(function(x){return x.id===id});if(!u||u.role==='admin')return;
  users=users.filter(function(x){return x.id!==id});saveUsers();renderAdminUsers();toast('User removed','er');
}
function renderAdminUsers(){
  var c=$('adminUserList'),list=users.filter(function(u){return u.role!=='admin'});
  if(!list.length){c.innerHTML='<p style="font-size:12px;color:var(--muted);text-align:center;padding:20px;">No registered users yet.</p>';return}
  c.innerHTML=list.map(function(u){
    var status=!u.verified?'<span class="status-pill status-bad">Unverified</span>':u.approved?'<span class="status-pill status-ok">Approved</span>':'<span class="status-pill status-wait">Pending</span>';
    return '<div class="admin-user"><div class="user-meta"><p style="font-size:13px;font-weight:600;">'+esc(userLabel(u))+'</p><p style="font-size:11px;color:var(--muted);">'+esc(u.email)+' · '+esc(S(S(u,'profile',{}),'designation','No designation'))+'</p>'+status+'</div><div style="display:flex;gap:6px;flex-shrink:0;">'
      +(!u.approved&&u.verified?'<button class="btn btn-ok btn-s" onclick="approveUser(\''+u.id+'\')">Approve</button>':'')
      +'<button class="btn btn-d btn-s" onclick="rejectUser(\''+u.id+'\')">Remove</button></div></div>';
  }).join('');
}

/* ===== COLOR PICKER ===== */
function renderColPk(){
  $('colPk').innerHTML=COLORS.map(function(c){return '<div onclick="selColor=\''+c+'\';renderColPk()" style="width:26px;height:26px;border-radius:7px;background:'+c+';cursor:pointer;border:2px solid '+(c===selColor?'#fff':'transparent')+';transition:border-color .2s;"></div>'}).join('');
}

/* ===== PROJECT MODAL ===== */
function openProjMo(id){
  if(!requireAuth())return;
  renderColPk();
  if(id){
    var p=projects.find(function(x){return x.id===id});
    if(!p)return;
    $('pId').value=p.id;$('pN').value=S(p,'name','');$('pD').value=SDesc(p);
    $('pPr').value=SPri(p);$('pCa').value=PCat(p);$('pDl').value=S(p,'deadline','');
    selColor=PColor(p);renderColPk();$('pmT').textContent='Edit Project';$('pSb').textContent='Save Changes';
  }else{
    $('pF').reset();$('pId').value='';selColor=COLORS[0];renderColPk();
    $('pmT').textContent='New Project';$('pSb').textContent='Create Project';
  }
  openMo('projMo');
}
function submitProj(e){
  e.preventDefault();
  var id=$('pId').value,name=$('pN').value.trim();
  if(!name){toast('Please enter a project name','er');return}
  var desc=$('pD').value.trim(),pri=$('pPr').value,cat=$('pCa').value,dead=$('pDl').value;
  if(id){
    var p=projects.find(function(x){return x.id===id});
    if(p){p.name=name;p.desc=desc;p.pri=pri;p.cat=cat;p.deadline=dead;p.color=selColor;toast('Project updated')}
  }else{
    projects.push({id:gid(),name:name,desc:desc,pri:pri,cat:cat,deadline:dead,color:selColor,archived:false,notes:'',created:today(),tasks:[]});
    toast('Project created');
  }
  saveData();closeMo('projMo');renderAll();
}

/* ===== TASK MODAL ===== */
function openTaskMo(pid,tid){
  if(!requireAuth())return;
  $('tPid').value=pid;editTL=[];
  if(tid){
    var p=projects.find(function(x){return x.id===pid});
    var tk=p?p.tasks.find(function(x){return x.id===tid}):null;
    if(!tk)return;
    $('tId').value=tk.id;$('tN').value=S(tk,'name','');$('tNo').value=TNotes(tk);
    $('tPr').value=SPri(tk);$('tHr').value=THrs(tk);
    editTL=JSON.parse(JSON.stringify(TLog(tk)));renderTL();
    $('tlSec').style.display='block';$('tmT').textContent='Edit Task';$('tSb').textContent='Save Changes';
  }else{
    $('tF').reset();$('tId').value='';editTL=[];renderTL();
    $('tlSec').style.display='none';$('tmT').textContent='Add Task';$('tSb').textContent='Add Task';
  }
  openMo('taskMo');
}
function renderTL(){
  var c=$('tlList');
  if(!editTL.length){c.innerHTML='<p style="font-size:11px;color:var(--muted);">No time logged yet.</p>';return}
  c.innerHTML=editTL.map(function(l,i){return '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px;background:var(--bg);border-radius:5px;font-size:11px;"><span style="color:var(--fg2);">'+l.min+' min — '+l.date+'</span><button type="button" onclick="editTL.splice('+i+',1);renderTL()" style="background:none;border:none;color:var(--err);cursor:pointer;font-size:10px;"><i class="fa-solid fa-xmark"></i></button></div>'}).join('');
}
function addTimeLog(){
  var m=parseInt($('logMin').value);
  if(!m||m<1){toast('Enter valid minutes','er');return}
  editTL.push({min:m,date:today()});$('logMin').value='';renderTL();
}
function submitTask(e){
  e.preventDefault();
  var pid=$('tPid').value,tid=$('tId').value,name=$('tN').value.trim();
  if(!name){toast('Please enter a task name','er');return}
  var notes=$('tNo').value.trim(),pri=$('tPr').value,hrs=parseFloat($('tHr').value)||1;
  var p=projects.find(function(x){return x.id===pid});
  if(!p){toast('Project not found','er');return}
  if(tid){
    var tk=p.tasks.find(function(x){return x.id===tid});
    if(tk){tk.name=name;tk.notes=notes;tk.pri=pri;tk.hrs=hrs;tk.timeLog=JSON.parse(JSON.stringify(editTL));toast('Task updated')}
  }else{
    p.tasks.push({id:gid(),name:name,notes:notes,pri:pri,hrs:hrs,done:false,created:today(),timeLog:[]});
    toast('Task added');
  }
  saveData();closeMo('taskMo');renderAll();
  setTimeout(function(){expanded.add(pid);applyExp()},30);
}

/* ===== ACTIONS ===== */
function toggleTask(pid,tid){
  var p=projects.find(function(x){return x.id===pid});if(!p)return;
  var tk=p.tasks.find(function(x){return x.id===tid});if(!tk)return;
  tk.done=!tk.done;
  if(tk.done){var tl=TLog(tk);if(!tl.some(function(l){return l.date===today()})){tl.push({min:Math.max(15,Math.round(THrs(tk)*30)),date:today()});tk.timeLog=tl}}
  saveData();renderAll();setTimeout(function(){expanded.add(pid);applyExp()},30);
}
function toggleArchive(pid){
  var p=projects.find(function(x){return x.id===pid});if(!p)return;
  p.archived=!p.archived;saveData();renderAll();toast(p.archived?'Project archived':'Project restored','in');
}
function deleteProj(id){
  delCb=function(){projects=projects.filter(function(x){return x.id!==id});expanded.delete(id);saveData();renderAll();toast('Project deleted','er')};
  $('delMsg').textContent='This project and all its tasks will be permanently deleted.';openMo('delMo');
}
function deleteTask(pid,tid){
  delCb=function(){var p=projects.find(function(x){return x.id===pid});if(p){p.tasks=p.tasks.filter(function(x){return x.id!==tid});saveData();renderAll();setTimeout(function(){expanded.add(pid);applyExp()},30);toast('Task deleted','er')}};
  $('delMsg').textContent='This task will be permanently removed.';openMo('delMo');
}
function execDel(){if(delCb)delCb();delCb=null;closeMo('delMo')}
function dupProj(id){
  var p=projects.find(function(x){return x.id===id});if(!p)return;
  var np=JSON.parse(JSON.stringify(p));np.id=gid();np.name=p.name+' (Copy)';np.created=today();np.archived=false;
  np.tasks.forEach(function(t){t.id=gid();t.done=false;t.timeLog=[];t.created=today()});
  projects.push(np);saveData();renderAll();toast('Project duplicated','in');
}
function clearDone(){
  var done=projects.filter(isDone);
  if(!done.length){toast('No completed projects to clear','in');return}
  delCb=function(){projects=projects.filter(function(p){return!isDone(p)});saveData();renderAll();toast(done.length+' completed project(s) cleared','er')};
  $('delMsg').textContent='Remove '+done.length+' completed project(s)? This cannot be undone.';openMo('delMo');
}
function resetAll(){
  if(!isAdmin()){toast('Only administrator can reset all data','er');return}
  delCb=function(){Object.keys(localStorage).forEach(function(k){if(k.indexOf('pp_')===0)localStorage.removeItem(k)});localStorage.setItem(VER_KEY,'5');projects=[];expanded=new Set();saveData();renderAll();toast('All data reset','in')};
  $('delMsg').textContent='Erase ALL data and start fresh? This cannot be undone.';openMo('delMo');
}

/* ===== NOTES ===== */
function openNotes(pid){
  var p=projects.find(function(x){return x.id===pid});if(!p)return;
  $('nPid').value=pid;$('nArea').value=PNotes(p);openMo('notesMo');
}
function saveNotes(){
  var pid=$('nPid').value,p=projects.find(function(x){return x.id===pid});
  if(p){p.notes=$('nArea').value.trim();saveData();renderAll();toast('Notes saved')}
  closeMo('notesMo');
}

/* ===== EXPANDED ===== */
function applyExp(){
  document.querySelectorAll('.ptasks').forEach(function(el){
    var pid=el.id.replace('tk-','');
    if(expanded.has(pid))el.classList.add('exp');else el.classList.remove('exp');
  });
}
function toggleExp(pid){if(expanded.has(pid))expanded.delete(pid);else expanded.add(pid);applyExp();localStorage.setItem(EXP,JSON.stringify([].concat(expanded)))}

/* ===== FILTERS ===== */
function renderFilters(){
  $('filterBar').innerHTML=FILTERS.map(function(f){return '<button class="ftab'+(f.key===curFilter?' on':'')+'" onclick="curFilter=\''+f.key+'\';renderFilters();renderProjects()">'+f.label+'</button>'}).join('');
}
function getFiltered(){
  var q=$('searchInp').value.toLowerCase();
  return projects.filter(function(p){
    var nm=S(p,'name','').toLowerCase(),ds=SDesc(p).toLowerCase();
    if(q&&!nm.includes(q)&&!ds.includes(q))return false;
    if(curFilter==='active')return !isDone(p)&&!PArchived(p);
    if(curFilter==='completed')return isDone(p)&&!PArchived(p);
    if(curFilter==='high')return SPri(p)==='high'&&!PArchived(p);
    if(curFilter==='archived')return PArchived(p);
    return !PArchived(p);
  });
}
function getSorted(list){
  var s=$('sortSel').value,pord={high:0,medium:1,low:2};
  return list.slice().sort(function(a,b){
    if(s==='priority')return(pord[SPri(a)]||1)-(pord[SPri(b)]||1);
    if(s==='name')return S(a,'name','').localeCompare(S(b,'name',''));
    if(s==='deadline')return(S(a,'deadline','9999')).localeCompare(S(b,'deadline','9999'));
    if(s==='progress')return pProg(b)-pProg(a);
    if(s==='newest')return SCreated(b).localeCompare(SCreated(a));
    return 0;
  });
}

/* ===== RENDER ===== */
function renderAll(){
  try{renderStats()}catch(e){console.error('Stats err:',e)}
  try{renderProjects()}catch(e){console.error('Projects err:',e)}
  try{renderCircular()}catch(e){console.error('Circular err:',e)}
  try{renderWeekly()}catch(e){console.error('Weekly err:',e)}
  try{renderStreak()}catch(e){console.error('Streak err:',e)}
  try{renderPriority()}catch(e){console.error('Priority err:',e)}
  try{renderCats()}catch(e){console.error('Cats err:',e)}
}
function animNum(id,target){
  var el=$(id);if(!el)return;var cur=parseInt(el.textContent)||0;
  if(cur===target){el.textContent=target;return}
  var d=target-cur,steps=Math.min(Math.abs(d),15),s=0;
  var iv=setInterval(function(){s++;el.textContent=Math.round(cur+d*s/steps);if(s>=steps)clearInterval(iv)},25);
}
function renderStats(){
  var vis=projects.filter(function(p){return!PArchived(p)});
  animNum('sT',vis.length);
  animNum('sC',vis.filter(isDone).length);
  var done=vis.reduce(function(s,p){return s+S(p,'tasks',[]).filter(function(t){return!!t.done}).length},0);
  animNum('sD',done);
  $('sS').innerHTML=getStreak()+' <span style="font-size:13px;color:var(--muted);font-weight:400;">days</span>';
  var total=vis.reduce(function(s,p){return s+S(p,'tasks',[]).length},0);
  $('sdD').textContent=done;$('sdL').textContent=total-done;
  var mins=vis.reduce(function(s,p){return s+S(p,'tasks',[]).reduce(function(s2,t){return s2+TLog(t).reduce(function(s3,l){return s3+(l.min||0)},0)},0)},0);
  $('sdH').textContent=(mins/60).toFixed(1)+'h';
}

function esc(str){return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}

function renderProjects(){
  var con=$('projCon'),empty=$('emptyState'),list=getSorted(getFiltered());
  if(!list.length){con.innerHTML='';empty.style.display='block';return}
  empty.style.display='none';
  var html='';
  for(var idx=0;idx<list.length;idx++){
    var p=list[idx],tasks=S(p,'tasks',[]),done=0,total=tasks.length;
    for(var ti=0;ti<tasks.length;ti++)if(tasks[ti].done)done++;
    var pct=total>0?Math.round(done/total*100):0;
    var comp=total>0&&done===total,arch=PArchived(p),pri=SPri(p),cat=PCat(p),col=PColor(p);
    var isExp=expanded.has(p.id);
    var dl=S(p,'deadline',''),overdue=false,daysLeft=null;
    if(dl){var dd=new Date(dl+'T00:00:00'),now=new Date();now.setHours(0,0,0,0);overdue=dd<now&&!comp;daysLeft=Math.ceil((dd-now)/864e5)}
    var logMins=0,estHrs=0;
    for(var li=0;li<tasks.length;li++){var tl=TLog(tasks[li]);for(var lj=0;lj<tl.length;lj++)logMins+=(tl[lj].min||0);estHrs+=THrs(tasks[li])}
    var dlHtml='';
    if(dl){var dc=overdue?'var(--err)':daysLeft<=2?'var(--accent)':'var(--muted)';var dt=overdue?'Overdue':daysLeft===0?'Due today':daysLeft+'d left';dlHtml='<span style="font-size:11px;color:'+dc+';display:flex;align-items:center;gap:3px;"><i class="fa-regular fa-calendar"></i>'+dt+'</span>'}
    var priClass=pri==='high'?'h':pri==='medium'?'m':'l';
    var catCol=CAT_C[cat]||'var(--accent)';
    var tasksHtml='';
    for(var tii=0;tii<tasks.length;tii++){
      var t=tasks[tii],tp=SPri(t),tpC=tp==='high'?'h':tp==='medium'?'m':'l',lm=0;
      var tll=TLog(t);for(var ll=0;ll<tll.length;ll++)lm+=(tll[ll].min||0);
      tasksHtml+='<div class="task-row" style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);">'
        +'<div class="tchk'+(t.done?' ck':'')+'" onclick="event.stopPropagation();toggleTask(\''+p.id+'\',\''+t.id+'\')" role="checkbox" aria-checked="'+!!t.done+'" tabindex="0"><i class="fa-solid fa-check"></i></div>'
        +'<div class="task-copy" style="flex:1;min-width:0;"><p style="font-size:12px;'+(t.done?'text-decoration:line-through;color:var(--muted);':'')+'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="'+esc(S(t,'name',''))+'">'+esc(S(t,'name',''))+'</p>'
        +(TNotes(t)?'<p style="font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;" title="'+esc(TNotes(t))+'">'+esc(TNotes(t))+'</p>':'')
        +'</div><span class="pri pri-'+tpC+'">'+tp+'</span><span class="timelog"><i class="fa-regular fa-clock"></i>'+lm+'m</span>'
        +'<div class="task-actions" style="display:flex;gap:2px;">'
        +'<button onclick="event.stopPropagation();openTaskMo(\''+p.id+'\',\''+t.id+'\')" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:3px;font-size:11px;" title="Edit"><i class="fa-solid fa-pen"></i></button>'
        +'<button onclick="event.stopPropagation();deleteTask(\''+p.id+'\',\''+t.id+'\')" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:3px;font-size:11px;" title="Delete"><i class="fa-solid fa-trash"></i></button>'
        +'</div></div>';
    }
    var pcol=pct===100?'var(--ok)':col;
    html+='<div class="card fi project-card" style="animation-delay:'+0.03*idx+'s;'+(comp?'opacity:.65;':'')+(arch?'border-style:dashed;opacity:.5;':'')+'">'
      +'<div class="project-toggle" style="padding:16px 18px;cursor:pointer;" onclick="toggleExp(\''+p.id+'\')">'
      +'<div class="project-head" style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;"><div class="project-copy" style="flex:1;min-width:0;">'
      +'<div class="project-title-row" style="display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap;">'
      +'<div style="width:8px;height:8px;border-radius:50%;background:'+col+';flex-shrink:0;"></div>'
      +'<h3 style="font-size:15px;font-weight:600;'+(comp?'text-decoration:line-through;':'')+'">'+esc(S(p,'name',''))+'</h3>'
      +'<span class="cat-badge" style="background:'+catCol+'22;color:'+catCol+';">'+cat+'</span>'
      +'<span class="pri pri-'+priClass+'">'+pri+'</span>'
      +(comp?'<span style="font-size:10px;color:var(--ok);font-weight:600;display:flex;align-items:center;gap:2px;"><i class="fa-solid fa-circle-check"></i>Done</span>':'')
      +(arch?'<span style="font-size:10px;color:var(--muted);font-weight:600;"><i class="fa-solid fa-box-archive"></i> Archived</span>':'')
      +'</div>'
      +(SDesc(p)?'<p style="font-size:12px;color:var(--muted);margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(SDesc(p))+'</p>':'')
      +'<div class="project-meta-row" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">'
      +'<div class="project-progress" style="flex:1;min-width:100px;max-width:260px;"><div style="display:flex;justify-content:space-between;margin-bottom:3px;">'
      +'<span style="font-size:11px;color:var(--fg2);">'+done+'/'+total+' tasks</span>'
      +'<span style="font-size:11px;font-weight:600;color:'+pcol+';">'+pct+'%</span></div>'
      +'<div class="ptrk"><div class="pfill" style="width:'+pct+'%;background:'+pcol+';"></div></div></div>'
      +dlHtml
      +'<span class="timelog"><i class="fa-solid fa-hourglass-half"></i>'+(logMins/60).toFixed(1)+'h / '+estHrs+'h</span>'
      +'</div></div>'
      +'<div class="project-actions" style="display:flex;align-items:center;gap:4px;flex-shrink:0;">'
      +(!arch?'<button class="btn btn-g btn-s" onclick="event.stopPropagation();openTaskMo(\''+p.id+'\')" title="Add task"><i class="fa-solid fa-plus"></i></button>'
      +'<button class="btn btn-g btn-s" onclick="event.stopPropagation();openNotes(\''+p.id+'\')" title="Notes"><i class="fa-solid fa-sticky-note"></i></button>'
      +'<button class="btn btn-g btn-s" onclick="event.stopPropagation();dupProj(\''+p.id+'\')" title="Duplicate"><i class="fa-solid fa-copy"></i></button>':'')
      +'<button class="btn btn-g btn-s" onclick="event.stopPropagation();toggleArchive(\''+p.id+'\')" title="'+(arch?'Restore':'Archive')+'"><i class="fa-solid fa-'+(arch?'box-open':'box-archive')+'"></i></button>'
      +(!arch?'<button class="btn btn-g btn-s" onclick="event.stopPropagation();openProjMo(\''+p.id+'\')" title="Edit"><i class="fa-solid fa-pen"></i></button>':'')
      +'<button class="btn btn-g btn-s" onclick="event.stopPropagation();deleteProj(\''+p.id+'\')" title="Delete" style="color:var(--err);"><i class="fa-solid fa-trash"></i></button>'
      +'<i class="fa-solid fa-chevron-'+(isExp?'up':'down')+'" style="color:var(--muted);font-size:10px;margin-left:2px;"></i>'
      +'</div></div></div>'
      +'<div class="ptasks'+(isExp?' exp':'')+'" id="tk-'+p.id+'"><div class="tasks-inner" style="padding:0 18px 14px;">'
      +(!total?'<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px;"><i class="fa-solid fa-clipboard-list" style="font-size:20px;margin-bottom:6px;display:block;opacity:.4;"></i>No tasks yet. Click + to add one.</div>':tasksHtml)
      +(!arch?'<button class="btn btn-g btn-s" style="width:100%;justify-content:center;margin-top:8px;" onclick="event.stopPropagation();openTaskMo(\''+p.id+'\')"><i class="fa-solid fa-plus"></i> Add Task</button>':'')
      +'</div></div></div>';
  }
  con.innerHTML=html;applyExp();
}

function renderCircular(){
  var vis=projects.filter(function(p){return!PArchived(p)});
  var total=vis.reduce(function(s,p){return s+S(p,'tasks',[]).length},0);
  var done=vis.reduce(function(s,p){return s+S(p,'tasks',[]).filter(function(t){return!!t.done}).length},0);
  var pct=total>0?done/total:0;
  $('cFill').style.strokeDashoffset=282.74*(1-pct);
  $('cPct').textContent=Math.round(pct*100)+'%';
}

function renderWeekly(){
  var ctx=$('wC').getContext('2d'),labels=[],added=[],completed=[];
  for(var i=6;i>=0;i--){
    var d=new Date();d.setDate(d.getDate()-i);var k=d.toISOString().split('T')[0];
    labels.push(d.toLocaleDateString('en',{weekday:'short'}));
    var a=0,c=0;
    projects.forEach(function(p){S(p,'tasks',[]).forEach(function(t){if(SCreated(t)===k)a++;if(t.done&&TLog(t).some(function(l){return l.date===k}))c++})});
    added.push(a);completed.push(c);
  }
  if(window._wc)window._wc.destroy();
  window._wc=new Chart(ctx,{type:'bar',data:{labels:labels,datasets:[
    {label:'Added',data:added,backgroundColor:'rgba(245,166,35,.25)',borderColor:'#F5A623',borderWidth:1,borderRadius:5,barPercentage:.55},
    {label:'Worked On',data:completed,backgroundColor:'rgba(14,203,129,.25)',borderColor:'#0ECB81',borderWidth:1,borderRadius:5,barPercentage:.55}
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'top',labels:{color:'#565E78',font:{size:10,family:'DM Sans'},boxWidth:10,boxHeight:10,borderRadius:2,useBorderRadius:true}}},scales:{x:{grid:{display:false},ticks:{color:'#565E78',font:{size:10,family:'DM Sans'}},border:{display:false}},y:{beginAtZero:true,grid:{color:'rgba(255,255,255,.03)'},ticks:{color:'#565E78',font:{size:10,family:'DM Sans'},stepSize:1},border:{display:false}}}}});
}

function renderStreak(){
  var g=$('streakG'),sd;try{sd=JSON.parse(localStorage.getItem(STK)||'{}')}catch(e){sd={}}
  var t=new Date(),html='';
  for(var i=13;i>=0;i--){
    var d=new Date(t);d.setDate(d.getDate()-i);var k=d.toISOString().split('T')[0];
    html+='<div class="sdot'+(i===0?' tod':sd[k]?' act':' ina')+'" title="'+k+'">'+d.toLocaleDateString('en',{weekday:'narrow'})+'</div>';
  }
  g.innerHTML=html;
  var s=getStreak(),h=$('streakHint');
  if(s>0){h.textContent='You\'re on a '+s+'-day streak. Keep it going!';h.style.color='var(--accent)'}
  else{h.textContent='Complete tasks daily to build your streak.';h.style.color='var(--muted)'}
}

function renderPriority(){
  var ctx=$('pC').getContext('2d'),vis=projects.filter(function(p){return!PArchived(p)});
  var txt=chartTextColor();
  var hi=0,mi=0,lo=0,hd=0,md=0,ld=0;
  vis.forEach(function(p){S(p,'tasks',[]).forEach(function(t){var pr=SPri(t);if(pr==='high')hi++;else if(pr==='medium')mi++;else lo++;if(t.done){if(pr==='high')hd++;else if(pr==='medium')md++;else ld++}})});
  if(window._pc)window._pc.destroy();
  window._pc=new Chart(ctx,{type:'doughnut',data:{labels:['High','Medium','Low'],datasets:[{data:[hi||.01,mi||.01,lo||.01],backgroundColor:['rgba(246,70,93,.6)','rgba(245,166,35,.6)','rgba(14,203,129,.6)'],borderColor:['#F6465D','#F5A623','#0ECB81'],borderWidth:1,hoverOffset:5}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom',labels:{color:txt,font:{size:11,family:'DM Sans'},padding:14,boxWidth:10,boxHeight:10,borderRadius:2,useBorderRadius:true,generateLabels:function(ch){var tt=[hi,mi,lo],dd=[hd,md,ld];return ch.data.labels.map(function(l,i){return{text:l+' ('+dd[i]+'/'+tt[i]+')',fillStyle:ch.data.datasets[0].backgroundColor[i],strokeStyle:ch.data.datasets[0].borderColor[i],fontColor:txt,lineWidth:1,borderRadius:2,index:i}})}}}}}});
}

function renderCats(){
  var vis=projects.filter(function(p){return!PArchived(p)}),cats={};
  vis.forEach(function(p){var c=PCat(p);if(!cats[c])cats[c]={total:0,done:0,hrs:0};var ts=S(p,'tasks',[]);cats[c].total+=ts.length;cats[c].done+=ts.filter(function(t){return!!t.done}).length;cats[c].hrs+=ts.reduce(function(s,t){return s+THrs(t)},0)});
  var c=$('catList'),keys=Object.keys(cats);
  if(!keys.length){c.innerHTML='<p style="font-size:12px;color:var(--muted);text-align:center;padding:10px;">No categories yet.</p>';return}
  c.innerHTML=keys.map(function(name){var data=cats[name],pct=data.total>0?Math.round(data.done/data.total*100):0,col=CAT_C[name]||'var(--accent)';
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);"><div style="width:6px;height:28px;border-radius:3px;background:'+col+';flex-shrink:0;"></div><div style="flex:1;min-width:0;"><div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span style="font-size:12px;font-weight:500;">'+name+'</span><span style="font-size:11px;color:var(--muted);">'+data.done+'/'+data.total+' · '+data.hrs+'h</span></div><div class="ptrk" style="height:5px;"><div class="pfill" style="width:'+pct+'%;background:'+col+';height:100%;"></div></div></div></div>'
  }).join('');
}

/* ===== EXPORT ===== */
function exportJSON(){
  try{var data=JSON.stringify({projects:projects,streak:JSON.parse(localStorage.getItem(STK)||'{}'),exported:new Date().toISOString()},null,2);var b=new Blob([data],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='wts-project-stats-'+today()+'.json';a.click();URL.revokeObjectURL(u);toast('Data exported','in')}
  catch(e){toast('Export failed','er')}
}

/* ===== INIT ===== */
applyTheme(localStorage.getItem(TK)||'dark');
var dateText=new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
['dateDisp','canvasDateDisp'].forEach(function(id){var el=$(id);if(el)el.textContent=dateText});
try{expanded=new Set(JSON.parse(localStorage.getItem(EXP)||'[]'))}catch(e){expanded=new Set()}
loadUsers();renderAuthBar();loadData();renderFilters();renderAll();applyAuthGate('signup');
