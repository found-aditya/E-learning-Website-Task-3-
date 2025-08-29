export async function loadCourses(){
  const res = await fetch('assets/data/courses.json');
  const courses = await res.json();
  return courses;
}

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const coursesGrid = document.getElementById('coursesGrid');
const categoryChips = document.getElementById('categoryChips');
const levelFilters = document.getElementById('levelFilters');
const sortFilters = document.getElementById('sortFilters');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

let state = { query: '', level: 'All', category: 'All', sort: 'popular', courses: [] };

document.addEventListener('DOMContentLoaded', async () => {
  state.courses = await loadCourses();
  renderCategories(state.courses);
  renderCourses();
  renderEnrolled();
});

function renderCategories(courses){
  const cats = Array.from(new Set(courses.map(c=>c.category)));
  const chips = ['All', ...cats].map(c=>`<button class="chip ${state.category===c?'active':''}" data-cat="${c}">${c}</button>`).join('');
  categoryChips.innerHTML = chips;
  categoryChips.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      state.category = btn.dataset.cat;
      categoryChips.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderCourses();
    });
  });
}

function applyFilters(list){
  let out = [...list];
  if (state.query) {
    const q = state.query.toLowerCase();
    out = out.filter(c => (c.title + c.short + c.instructor + c.category).toLowerCase().includes(q));
  }
  if (state.level !== 'All') out = out.filter(c => c.level === state.level);
  if (state.category !== 'All') out = out.filter(c => c.category === state.category);
  switch(state.sort){
    case 'rating': out.sort((a,b)=>b.rating-a.rating); break;
    case 'newest': out.sort((a,b)=> (a.id < b.id ? 1 : -1)); break;
    case 'price_low': out.sort((a,b)=>a.price-b.price); break;
    case 'price_high': out.sort((a,b)=>b.price-a.price); break;
    default: out.sort((a,b)=>b.students-a.students);
  }
  return out;
}

function renderCourses(){
  const list = applyFilters(state.courses);
  coursesGrid.innerHTML = list.map(c=>Card(c)).join('');
  coursesGrid.querySelectorAll('[data-enroll]').forEach(btn=>{
    btn.addEventListener('click', ()=> enroll(btn.dataset.enroll));
  });
}

function Card(c){
  return `
  <article class="card">
    <div class="thumb">
      <img src="${c.thumbnail}" alt="${c.title}" loading="lazy" />
    </div>
    <div class="card-body">
      <div class="badge">${c.badge}</div>
      <h3 style="margin:4px 0 2px;"><a href="course.html?id=${c.id}">${c.title}</a></h3>
      <div class="meta"><span>${c.instructor}</span> • <span>${c.level}</span> • <span>${c.duration}</span> <span class="price">${c.price>0?'₹'+c.price:'Free'}</span></div>
      <p style="color:var(--muted);margin:0;">${c.short}</p>
      <div class="tags">
        <span class="tag">⭐ ${c.rating}</span>
        <span class="tag">👥 ${c.students.toLocaleString()}</span>
        <span class="tag">${c.category}</span>
      </div>
    </div>
    <div class="card-footer">
      <a class="btn" href="course.html?id=${c.id}">View details</a>
      <button class="btn primary" data-enroll="${c.id}">Enroll</button>
    </div>
  </article>`;
}

function enroll(id){
  const course = state.courses.find(c=>c.id===id);
  const list = JSON.parse(localStorage.getItem('enrolled')||'[]');
  if(!list.find(x=>x.id===id)){
    list.push({id:course.id,title:course.title,price:course.price});
    localStorage.setItem('enrolled', JSON.stringify(list));
    renderEnrolled();
  }
}

function renderEnrolled(){
  const list = JSON.parse(localStorage.getItem('enrolled')||'[]');
  const el = document.getElementById('enrolledList');
  if(!el) return;
  if(list.length===0){ el.innerHTML = '<div class="meta">No courses yet.</div>'; return; }
  el.innerHTML = list.map(x=>`<div class="row"><span>${x.title}</span><span>${x.price>0?'₹'+x.price:'Free'}</span></div>`).join('');
}

if(levelFilters){
  levelFilters.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      state.level = btn.dataset.level;
      levelFilters.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderCourses();
    });
  });
}

if(sortFilters){
  sortFilters.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      state.sort = btn.dataset.sort;
      sortFilters.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderCourses();
    });
  });
}

if(searchBtn && searchInput){
  const doSearch = ()=>{ state.query = searchInput.value.trim(); renderCourses(); }
  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', e=>{ if(e.key==='Enter') doSearch(); });
}
