const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const state = { requirements: [], defects: [], reviews: [], tests: [], capas: [], reqFilter: 'All', reqSearch: '' };
const entityFields = {
  requirement: [
    ['code','Requirement ID','text','REQ-009',true],['title','Requirement title','text','Name the outcome',true],
    ['description','Acceptance criteria / description','textarea','State measurable behavior, boundary conditions, and response time.',true,'wide'],
    ['category','Quality area','select','',true,'wide',['Data integrity','Interoperability','Status transitions','Reliability','Efficiency','Security','Maintainability']],
    ['owner','Accountable owner','text','BA Team',true],['risk','Risk','select','',true,'',['Low','Medium','High','Critical']],
    ['status','Status','select','',true,'',['Draft','In review','Approved']],['design_ref','Design reference','text','Design §…'],
    ['test_ref','Test case reference','text','TC-…'],['defect_ref','Related defect','text','DF-…']
  ],
  defect: [
    ['code','Defect ID','text','DF-028',true],['title','Defect summary','text','Describe the observed behavior',true],
    ['category','Category','select','',true,'',['Data integrity','Interoperability','Status transitions','Reliability','Efficiency','Security','Maintainability']],
    ['severity','Severity','select','',true,'',['Low','Medium','High','Critical']],['status','Status','select','',true,'',['Open','In progress','Resolved','Reopened']],
    ['owner','Assigned owner','text','Developer / team',true],['requirement_id','Linked requirement (record ID)','number','',false],
    ['opened','Date opened','date','',true],['description','Steps / impact','textarea','',false,'wide']
  ],
  review: [
    ['title','Review title','text','Artifact review',true],['artifact','Artifact / baseline','text','SRS v1.x',true],
    ['reviewer','Reviewer / approval authority','text','Technical Architect',true],['status','Status','select','',true,'',['Scheduled','In review','Approved','Rework']],
    ['due','Due date','date','',true],['notes','Agenda / findings','textarea','Checklist focus and decision notes',false,'wide']
  ],
  test: [
    ['code','Test case ID','text','TC-901',true],['title','Test case name','text','Verifiable outcome',true],
    ['area','Interface / quality area','text','Order intake',true],['owner','Test owner','text','Test Manager',true],
    ['status','Execution status','select','',true,'',['Not run','Running','Blocked','Passed']],
    ['last_result','Latest result','select','',true,'',['—','Pass','Fail','Blocked']],['requirement_id','Linked requirement (record ID)','number','',false]
  ],
  capa: [
    ['code','Action ID','text','CAPA-010',true],['title','Corrective / preventive action','text','Action statement',true],
    ['root_cause','Root cause analysis','textarea','Evidence-based cause, not a symptom.',true,'wide'],
    ['owner','Action owner','text','Accountable role',true],['due','Due date','date','',true],
    ['status','Status','select','',true,'',['Open','In progress','Verification','Closed']],
    ['effectiveness','Effectiveness evidence','text','Pending',false,'wide']
  ]
};
const entityEndpoint = { requirement:'requirements', defect:'defects', review:'reviews', test:'tests', capa:'capas' };
const requiredOptions = {
  requirements: { status:['Draft','In review','Approved'], risk:['Low','Medium','High','Critical'] },
  defects: { status:['Open','In progress','Resolved','Reopened'], severity:['Low','Medium','High','Critical'] },
  reviews: { status:['Scheduled','In review','Approved','Rework'] },
  tests: { status:['Not run','Running','Blocked','Passed'], last_result:['—','Pass','Fail','Blocked'] },
  capas: { status:['Open','In progress','Verification','Closed'] }
};

async function api(path, options = {}) {
  const response = await fetch(`/api/${path}`, { headers:{'Content-Type':'application/json'}, ...options });
  let data;
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function chip(value) { return `<span class="status-chip ${esc(String(value).replace(/\s/g,'-'))}">${esc(value || '—')}</span>`; }
function toast(message, error = false) {
  const el = $('#toast'); el.textContent = message; el.style.background = error ? '#9c3d39' : '';
  el.classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(()=>el.classList.remove('visible'),2800);
}
function showPage(name) {
  const page = name || 'overview';
  $$('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${page}`));
  $$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  $('#crumb-current').textContent = page.replace(/-/g,' ').toUpperCase();
  if (page==='overview') loadDashboard();
  if (page==='requirements') renderRequirements();
  if (page==='reviews') renderReviews();
  if (page==='verification') renderVerification();
  if (page==='measures') renderMeasures();
  if (page==='release') loadRelease();
  if (page==='improvement') renderCapas();
  window.scrollTo({top:0,behavior:'smooth'});
}
async function loadAll() {
  try {
    const [requirements,defects,reviews,tests,capas] = await Promise.all(['requirements','defects','reviews','tests','capas'].map(x=>api(x)));
    Object.assign(state,{requirements,defects,reviews,tests,capas});
    $('#nav-req-count').textContent=String(requirements.length).padStart(2,'0');
    renderRequirements(); renderReviews(); renderVerification(); renderCapas(); renderMeasures(); loadDashboard();
  } catch(e) { toast(`Could not load workspace: ${e.message}`,true); }
}
function renderRequirements() {
  const rows=state.requirements.filter(r=>(state.reqFilter==='All'||r.status===state.reqFilter)&&
    `${r.code} ${r.title} ${r.description} ${r.owner} ${r.category}`.toLowerCase().includes(state.reqSearch.toLowerCase()));
  $('#req-total').textContent=state.requirements.length;
  $('#req-empty').hidden=rows.length>0;
  $('#requirements-body').innerHTML=rows.map(r=>`<tr>
    <td><span class="req-id">${esc(r.code)}</span><div class="table-title">${esc(r.title)}</div><div class="table-sub">${esc(r.description)}</div></td>
    <td><span class="risk-label ${esc(r.risk)}">${esc(r.risk)}</span><div class="table-sub">${esc(r.category)}</div></td>
    <td>${esc(r.owner)}</td><td>${r.design_ref?`<span class="link-ref">${esc(r.design_ref)}</span>`:'<span class="missing-ref">Not linked</span>'}</td>
    <td>${r.test_ref?`<span class="link-ref">${esc(r.test_ref)}</span>`:'<span class="missing-ref">Not linked</span>'}</td>
    <td>${chip(r.status)}</td><td><button class="table-action" data-edit="requirement" data-id="${r.id}" aria-label="Edit ${esc(r.code)}">✎</button><button class="table-action" data-delete="requirements" data-id="${r.id}" aria-label="Delete ${esc(r.code)}">×</button></td></tr>`).join('');
}
function renderReviews() {
  $('#reviews-list').innerHTML=state.reviews.map(r=>`<article class="review-card"><div><span class="review-artifact">${esc(r.artifact)}</span><h3>${esc(r.title)}</h3><span class="review-meta"><span>Authority <b>${esc(r.reviewer)}</b></span><span>Due <b>${esc(r.due)}</b></span></span></div>${chip(r.status)}<div class="review-notes">${esc(r.notes||'No review notes recorded.')}</div><div class="review-controls"><button class="small-button" data-cycle="reviews" data-id="${r.id}">Update decision ↗</button><button class="small-button" data-edit="review" data-id="${r.id}">Edit</button><button class="small-button" data-delete="reviews" data-id="${r.id}">Delete</button></div></article>`).join('');
}
function renderVerification() {
  const filter=$('#test-filter')?.value||'All';
  const tests=state.tests.filter(t=>filter==='All'||t.last_result===filter);
  const countResult=x=>state.tests.filter(t=>t.last_result===x).length;
  $('#verify-pass').textContent=countResult('Pass');$('#verify-blocked').textContent=countResult('Blocked');
  $('#verify-notrun').textContent=countResult('—');$('#verify-defects').textContent=state.defects.filter(d=>!['Resolved','Closed'].includes(d.status)).length;
  $('#tests-body').innerHTML=tests.map(t=>`<tr><td><span class="test-id">${esc(t.code)}</span></td><td><div class="table-title">${esc(t.title)}</div></td><td>${esc(t.area)}</td><td>${esc(t.owner)}</td><td>${t.requirement_id?`REQ-${String(t.requirement_id).padStart(3,'0')}`:'—'}</td><td>${chip(t.last_result==='Pass'?'Passed':t.last_result)}</td><td><button class="table-action" data-cycle="tests" data-id="${t.id}" aria-label="Update result">↻</button><button class="table-action" data-edit="test" data-id="${t.id}" aria-label="Edit test">✎</button><button class="table-action" data-delete="tests" data-id="${t.id}" aria-label="Delete test">×</button></td></tr>`).join('');
  $('#defect-total').textContent=state.defects.length;
  $('#defects-body').innerHTML=state.defects.map(d=>`<tr><td><span class="defect-id">${esc(d.code)}</span></td><td><div class="table-title">${esc(d.title)}</div><div class="table-sub">${esc(d.description)}</div></td><td>${esc(d.category)}</td><td><span class="risk-label ${esc(d.severity)}">${esc(d.severity)}</span></td><td>${esc(d.owner)}</td><td>${chip(d.status)}</td><td><button class="table-action" data-cycle="defects" data-id="${d.id}" aria-label="Update defect status">↻</button><button class="table-action" data-edit="defect" data-id="${d.id}" aria-label="Edit defect">✎</button><button class="table-action" data-delete="defects" data-id="${d.id}" aria-label="Delete defect">×</button></td></tr>`).join('');
}
async function renderMeasures() {
  try {
    const r=await api('report');
    const values=[
      ['REQUIREMENTS COVERAGE',`${r.coverage}%`,`${r.tracedRequirements} of ${r.requirements} requirements have test links`,'CURRENT'],
      ['TEST PASS RATE',`${r.testPassRate}%`,`${r.passed} of ${r.tests} cases passed`,'CURRENT'],
      ['ESCAPED DEFECT RATE',`${r.escapedRate}%`,`${r.escapedDefects} escaped of ${r.totalDefects} tracked defects`,'CURRENT'],
      ['REOPEN RATE',`${r.reopenRate}%`,`${r.reopened} of ${r.totalDefects} tracked defects reopened`,'CURRENT'],
      ['FIRST-PASS REVIEW YIELD',`${r.firstPassReviewYield}%`,r.firstPassReviewYieldBasis,'DEMO ESTIMATE'],
      ['DEFECT AGING',`${Number(r.medianOpenDefectAgeDays).toFixed(1)}d`,'Median age of currently open defects','CURRENT'],
      ['INTERFACE FAILURES',String(r.interfaceContractFailures),'Open interoperability contract defects','CURRENT'],
      ['CHANGE IMPACT COVERAGE',`${r.changeImpactCoverage}%`,r.changeImpactCoverageBasis,'DEMO ESTIMATE']
    ];
    $('#measure-grid').innerHTML=values.map(v=>`<article class="measure-card"><div class="metric-label">${esc(v[0])} <span class="measure-delta ${v[3]==='DEMO ESTIMATE'?'estimate-tag':''}">${esc(v[3])}</span></div><div class="metric-number">${esc(v[1])}</div><p>${esc(v[2])}</p></article>`).join('');
  } catch(e) { $('#measure-grid').innerHTML=`<div class="empty-state">Report unavailable: ${esc(e.message)}</div>`; }
}
function renderCapas() {
  $('#capas-list').innerHTML=state.capas.map(c=>`<article class="capa-card"><div class="capa-card-head"><span class="req-id">${esc(c.code)}</span>${chip(c.status)}</div><h3>${esc(c.title)}</h3><p>${esc(c.root_cause)}</p><div class="capa-foot"><span>OWNER <b>${esc(c.owner)}</b></span><span>DUE <b>${esc(c.due)}</b></span></div><div class="capa-foot"><span>EFFECTIVENESS <b>${esc(c.effectiveness||'Pending')}</b></span><span></span></div><div class="capa-controls"><button class="small-button" data-cycle="capas" data-id="${c.id}">Advance action ↗</button><button class="small-button" data-edit="capa" data-id="${c.id}">Edit</button><button class="small-button" data-delete="capas" data-id="${c.id}">Delete</button></div></article>`).join('');
}
async function loadDashboard() {
  try {
    const [d,r,gate]=await Promise.all([api('dashboard'),api('report'),api('release')]);
    const activeUser=d.currentUser||{initials:'QMS',name:'Project team',title:'Restart app to load profile'};
    $('#active-user-initials').textContent=activeUser.initials;
    $('#active-user-name').textContent=activeUser.name;
    $('#active-user-title').textContent=activeUser.title;
    $('#metric-defects').textContent=d.openDefects;$('#metric-pass').textContent=d.passRate;
    $('#metric-critical').textContent=d.criticalDefects;
    $('#metric-tests').textContent=`${d.passedTests} of ${d.tests} cases passed`;
    $('#pass-track').style.width=`${Math.min(100,d.passRate)}%`;
    $('#metric-coverage').textContent=r.coverage;$('#metric-req').textContent=`${r.tracedRequirements} of ${r.requirements} requirements`;
    $('#coverage-track').style.width=`${r.coverage}%`;$('#metric-reviews').textContent=d.pendingReviews;
    const blockers=gate.checks.filter(check=>!check.pass).length;
    $('#gate-summary').textContent=gate.ready?'All checks passed':`At risk · ${blockers} blocker${blockers===1?'':'s'}`;
    $('#gate-mark').textContent=gate.ready?'✓':'!';
    $('#gate-mark').classList.toggle('gate-ready',gate.ready);
    $('#lifecycle').innerHTML=d.stages.map((s,i)=>`<div class="stage ${s.state}"><div class="stage-dot">${s.state==='done'?'✓':s.state==='active'?'':'·'}</div><div class="stage-name">${esc(s.name)}</div><div class="stage-detail">${esc(s.detail)}</div></div>`).join('');
    $('#activity-list').innerHTML=d.activity.map(a=>`<div class="activity-item"><div class="activity-time">${esc(a.time)}</div><i class="activity-pin ${esc(a.tone)}"></i><div><div class="activity-title">${esc(a.title)}</div><div class="activity-detail">${esc(a.detail)}</div></div></div>`).join('');
  } catch(e) { toast(`Dashboard unavailable: ${e.message}`,true); }
}
async function loadRelease() {
  try {
    const r=await api('release');
    $('#release-checks').innerHTML=r.checks.map(c=>`<div class="check-row"><span class="check-icon ${c.pass?'pass':'fail'}">${c.pass?'✓':'!'}</span><div><div class="check-title">${esc(c.name)}</div><div class="check-detail">${esc(c.detail)}</div></div><span class="check-status ${c.pass?'pass':''}">${c.pass?'PASS':'BLOCKED'}</span></div>`).join('');
    $('#release-state').textContent=r.ready?'ALL GATES PASSED':'GATE AT RISK · ACTION REQUIRED';
    $('#release-state').classList.toggle('ready',r.ready);
    $('#approval-name').value=r.approval.approved_by||'';
    $('#rollback-ready').checked=!!Number(r.approval.rollback_ready);
    $('#monitoring-ready').checked=!!Number(r.approval.monitoring_ready);
  } catch(e) { toast(`Release gate unavailable: ${e.message}`,true); }
}
function openDialog(kind, record = null) {
  const fields=entityFields[kind];
  $('#dialog-eyebrow').textContent=record?'UPDATE RECORD':'NEW RECORD';
  $('#dialog-title').textContent=`${record?'Edit':'Add'} ${kind==='capa'?'corrective action':kind}`;
  $('#form-fields').innerHTML=fields.map(([name,label,type,placeholder,required,span,options])=>{
    const value=record?.[name]??(name==='opened'?new Date().toISOString().slice(0,10):'');
    let control;
    if(type==='select')control=`<select name="${name}" ${required?'required':''}><option value="">Choose…</option>${options.map(o=>`<option ${String(value)===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
    else if(type==='textarea')control=`<textarea name="${name}" placeholder="${esc(placeholder)}" ${required?'required':''}>${esc(value)}</textarea>`;
    else control=`<input type="${type}" name="${name}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${required?'required':''} ${type==='text'?'maxlength="300"':''}>`;
    return `<div class="field ${span==='wide'?'wide':''}"><label>${esc(label.toUpperCase())}${required?' *':''}</label>${control}</div>`;
  }).join('');
  $('#record-form').dataset.kind=kind;$('#record-form').dataset.id=record?.id||'';
  $('#record-dialog').showModal();
}
async function saveForm(event) {
  event.preventDefault();
  const form=event.currentTarget, kind=form.dataset.kind, id=form.dataset.id;
  const data=Object.fromEntries(new FormData(form).entries());
  if(data.requirement_id)data.requirement_id=Number(data.requirement_id);else delete data.requirement_id;
  try {
    await api(`${entityEndpoint[kind]}${id?`/${id}`:''}`,{method:id?'PATCH':'POST',body:JSON.stringify(data)});
    $('#record-dialog').close();toast(`${kind==='capa'?'Corrective action':kind[0].toUpperCase()+kind.slice(1)} ${id?'updated':'created'}.`);
    await loadAll();const current=$('.page.active')?.id.replace('page-','');if(current)showPage(current);
  } catch(e) { toast(e.message,true); }
}
async function deleteRecord(collection,id) {
  const item=state[collection]?.find(x=>String(x.id)===String(id));
  if(!item||!confirm(`Delete ${item.code||item.title||'this record'}? This cannot be undone.`))return;
  try { await api(`${collection}/${id}`,{method:'DELETE'});toast('Record deleted.');await loadAll(); }
  catch(e) { toast(e.message,true); }
}
async function cycleRecord(collection,id) {
  const configs={reviews:{key:'status',values:['Scheduled','In review','Approved','Rework']},
    tests:{key:'last_result',values:['—','Pass','Fail','Blocked']},
    defects:{key:'status',values:['Open','In progress','Resolved','Reopened']},
    capas:{key:'status',values:['Open','In progress','Verification','Closed']}};
  const cfg=configs[collection],record=state[collection].find(x=>String(x.id)===String(id));
  const index=cfg.values.indexOf(record[cfg.key]),next=cfg.values[(index+1)%cfg.values.length];
  if(collection==='capas'&&next==='Closed'){
    const evidence=String(record.effectiveness||'').trim();
    if(!evidence||['pending','retest scheduled'].includes(evidence.toLowerCase())){toast('Record independent effectiveness evidence before closing this CAPA.',true);return;}
    if(!confirm('Close this CAPA after independent effectiveness verification?'))return;
  }
  try { await api(`${collection}/${id}`,{method:'PATCH',body:JSON.stringify({[cfg.key]:next})});toast(`${collection.slice(0,-1)} updated to ${next}.`);await loadAll(); }
  catch(e) { toast(e.message,true); }
}
function downloadCsv(filename,rows) {
  const csv=rows.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));link.download=filename;link.click();URL.revokeObjectURL(link.href);
}
$$('.nav-link,[data-page]').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();showPage(button.dataset.page)}));
const menuToggle=$('#mobile-menu-toggle'), primaryNavigation=$('#primary-navigation');
function closeMobileNavigation(restoreFocus=false) {
  primaryNavigation.classList.remove('open');
  menuToggle.setAttribute('aria-expanded','false');
  if(restoreFocus)menuToggle.focus();
}
menuToggle.addEventListener('click',()=>{
  const open=menuToggle.getAttribute('aria-expanded')!=='true';
  menuToggle.setAttribute('aria-expanded',String(open));
  primaryNavigation.classList.toggle('open',open);
  if(open)primaryNavigation.querySelector('.nav-link.active')?.focus();
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuToggle.getAttribute('aria-expanded')==='true')closeMobileNavigation(true);});
primaryNavigation.addEventListener('click',event=>{if(event.target.closest('.nav-link'))closeMobileNavigation(true);});
document.addEventListener('click',e=>{
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(action)openDialog(action.replace('new-',''));
  const edit=e.target.closest('[data-edit]');
  if(edit){const kind=edit.dataset.edit;const collection=entityEndpoint[kind];const record=state[collection].find(x=>String(x.id)===edit.dataset.id);openDialog(kind,record);}
  const del=e.target.closest('[data-delete]');if(del)deleteRecord(del.dataset.delete,del.dataset.id);
  const cycle=e.target.closest('[data-cycle]');if(cycle)cycleRecord(cycle.dataset.cycle,cycle.dataset.id);
});
$('#record-form').addEventListener('submit',saveForm);
$('#dialog-close').addEventListener('click',()=>$('#record-dialog').close());
$('#dialog-cancel').addEventListener('click',()=>$('#record-dialog').close());
$('#req-filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;state.reqFilter=b.dataset.filter;$$('button',e.currentTarget).forEach(x=>x.classList.toggle('selected',x===b));renderRequirements();});
$('#req-search').addEventListener('input',e=>{state.reqSearch=e.target.value;renderRequirements();});
$('#test-filter').addEventListener('change',renderVerification);
$('#refresh-btn').addEventListener('click',()=>{loadAll();toast('Workspace refreshed.');});
$('#activity-refresh').addEventListener('click',loadDashboard);
$('#export-rtm').addEventListener('click',()=>downloadCsv('ldms-requirements-traceability.csv',[['ID','Requirement','Category','Risk','Owner','Status','Design reference','Test reference','Related defect'],...state.requirements.map(r=>[r.code,r.title,r.category,r.risk,r.owner,r.status,r.design_ref,r.test_ref,r.defect_ref])]));
$('#download-report').addEventListener('click',async()=>{try{const r=await api('report');downloadCsv(`ldms-quality-report-${r.generatedAt}.csv`,[['Metric','Value'],['Requirements coverage',`${r.coverage}%`],['Traced requirements',`${r.tracedRequirements}/${r.requirements}`],['Test pass rate',`${r.testPassRate}%`],['Tests passed',`${r.passed}/${r.tests}`],['Escaped defect rate',`${r.escapedRate}%`],['Reopened defects',r.reopened],['Median open defect age (days)',r.medianOpenDefectAgeDays],['First-pass review yield — illustrative demo estimate',`${r.firstPassReviewYield}%`],['First-pass estimate basis',r.firstPassReviewYieldBasis],['Interface contract failures',r.interfaceContractFailures],['Change impact coverage — illustrative demo estimate',`${r.changeImpactCoverage}%`],['Change impact estimate basis',r.changeImpactCoverageBasis],['Generated',r.generatedAt]]);}catch(e){toast(e.message,true);}});
$('#save-release').addEventListener('click',async()=>{try{await api('release',{method:'PATCH',body:JSON.stringify({approved_by:$('#approval-name').value,rollback_ready:$('#rollback-ready').checked,monitoring_ready:$('#monitoring-ready').checked})});toast('Release evidence saved.');loadRelease();}catch(e){toast(e.message,true);}});
$('#today-label').textContent=new Intl.DateTimeFormat('en',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(new Date()).toUpperCase();
loadAll();
