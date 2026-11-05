import React, { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Activity, Factory, Gauge, LayoutDashboard, ClipboardList, AlertTriangle, FileBarChart, Plus, RefreshCw, Trash2, Menu, X, CheckCircle2, ClipboardCheck, Wrench, Truck, DraftingCompass, Package, Users, Briefcase, Boxes } from "lucide-react";

const API = "http://127.0.0.1:8000";
const today = new Date().toISOString().slice(0,10);
const emptyProduction = {record_date:today,shift:"A",time_slot:"09:00-10:00",machine:"VMC-01",operator:"Operator 1",part_name:"Front Fork Lower Housing",target_qty:50,actual_qty:0,rejection_qty:0,remarks:""};
const emptyRejection = {record_date:today,shift:"A",machine:"VMC-01",part_name:"Front Fork Lower Housing",defect_type:"Dimensional rejection",quantity:1,operator:"Operator 1",remarks:""};
const departments = {
  "Quality": {icon:ClipboardCheck, subtitle:"Inspection, customer complaints, NCR and corrective actions", categories:["Incoming inspection","In-process inspection","Final inspection","Customer complaint","NCR","CAPA","Calibration"], statuses:["Open","Under Investigation","Action in Progress","Closed"]},
  "Maintenance": {icon:Wrench, subtitle:"Breakdowns, preventive maintenance and machine health", categories:["Machine breakdown","Preventive maintenance","Electrical","Mechanical","Hydraulic / Pneumatic","Spare parts","Utility"], statuses:["Open","Assigned","In Progress","Waiting for Parts","Completed"]},
  "Delivery & Dispatch": {icon:Truck, subtitle:"Customer orders, dispatch planning and delivery follow-up", categories:["Customer order","Dispatch","Packing","Transport","Delivery delay","Documentation"], statuses:["Pending","Ready for Dispatch","Dispatched","Delivered","Delayed"]},
  "Design & Engineering": {icon:DraftingCompass, subtitle:"Drawings, revisions, engineering changes and tooling projects", categories:["New drawing","Drawing revision","ECN","Tool design","Process development","Trial / validation"], statuses:["Requested","Under Design","For Approval","Released","On Hold","Completed"]},
  "Stores & Inventory": {icon:Package, subtitle:"Raw material, cutting tools, inserts, consumables and stock", categories:["Raw material","Cutting tool","Insert","Tool holder","Consumable","Spare part","Purchase request"], statuses:["Requested","Available","Low Stock","Ordered","Received","Issued"]},
  "HR & Manpower": {icon:Users, subtitle:"Attendance, manpower, shifts, training and skill development", categories:["Attendance","Manpower allocation","Training","Skill assessment","Leave","Safety training"], statuses:["Open","Planned","In Progress","Completed"]}
};

async function request(path, options={}) {
  const response = await fetch(`${API}${path}`, {headers:{"Content-Type":"application/json"}, ...options});
  if (!response.ok) {
    let message = "Request failed";
    try { const body = await response.json(); message = body.detail || message; } catch {}
    throw new Error(Array.isArray(message) ? message.map(x=>x.msg).join(", ") : message);
  }
  return response.json();
}
const num = n => Number(n || 0).toLocaleString("en-IN");
const pct = n => `${Number(n || 0).toFixed(2)}%`;

export default function App() {
  const [page,setPage] = useState("Dashboard");
  const [mobileOpen,setMobileOpen] = useState(false);
  const [production,setProduction] = useState([]);
  const [rejections,setRejections] = useState([]);
  const [departmentEntries,setDepartmentEntries] = useState([]);
  const [deptForm,setDeptForm] = useState({record_date:today,title:"",category:"",reference:"",status:"Open",owner:"",quantity:0,remarks:""});
  const [summary,setSummary] = useState(null);
  const [prodForm,setProdForm] = useState(emptyProduction);
  const [rejForm,setRejForm] = useState(emptyRejection);
  const [start,setStart] = useState(new Date(Date.now()-6*86400000).toISOString().slice(0,10));
  const [end,setEnd] = useState(today);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState("");
  const [error,setError] = useState("");

  const range = `?start=${start}&end=${end}`;
  async function load() {
    setBusy(true); setError("");
    try {
      const [p,r,s,d] = await Promise.all([
        request(`/api/production${range}`), request(`/api/rejections${range}`), request(`/api/reports/summary${range}`), request(`/api/department-entries${range}`)
      ]);
      setProduction(p); setRejections(r); setSummary(s); setDepartmentEntries(d);
    } catch(e) { setError(`${e.message}. Is the FastAPI backend running on port 8000?`); }
    finally { setBusy(false); }
  }
  useEffect(()=>{load();},[start,end]);

  async function submitProduction(e) {
    e.preventDefault(); setNotice(""); setError("");
    try {
      await request("/api/production",{method:"POST",body:JSON.stringify({...prodForm,target_qty:Number(prodForm.target_qty),actual_qty:Number(prodForm.actual_qty),rejection_qty:Number(prodForm.rejection_qty)})});
      setNotice("Production record saved."); setProdForm({...emptyProduction,record_date:today}); await load();
    } catch(e){setError(e.message);}
  }
  async function submitRejection(e) {
    e.preventDefault(); setNotice(""); setError("");
    try {
      await request("/api/rejections",{method:"POST",body:JSON.stringify({...rejForm,quantity:Number(rejForm.quantity)})});
      setNotice("Rejection record saved."); setRejForm({...emptyRejection,record_date:today}); await load();
    } catch(e){setError(e.message);}
  }
  async function submitDepartmentEntry(e) {
    e.preventDefault(); setNotice(""); setError("");
    try {
      await request("/api/department-entries", {method:"POST", body:JSON.stringify({...deptForm,department:page,quantity:Number(deptForm.quantity)})});
      setNotice(`${page} record saved.`);
      setDeptForm({record_date:today,title:"",category:departments[page]?.categories[0] || "General",reference:"",status:departments[page]?.statuses[0] || "Open",owner:"",quantity:0,remarks:""});
      await load();
    } catch(e) { setError(e.message); }
  }
  async function remove(path) {
    if(!window.confirm("Delete this record?")) return;
    try { await request(path,{method:"DELETE"}); setNotice("Record deleted."); await load(); }
    catch(e){setError(e.message);}
  }
  function exportCSV() {
    const rows = [["Date","Shift","Time","Machine","Operator","Part","Target","Actual","Rejection","Good","Achievement %","Rejection %"]];
    production.forEach(x=>rows.push([x.record_date,x.shift,x.time_slot,x.machine,x.operator,x.part_name,x.target_qty,x.actual_qty,x.rejection_qty,x.actual_qty-x.rejection_qty,x.target_qty?((x.actual_qty/x.target_qty)*100).toFixed(2):0,x.actual_qty?((x.rejection_qty/x.actual_qty)*100).toFixed(2):0]));
    const csv = rows.map(row=>row.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    const a=document.createElement("a");a.href=url;a.download="factorymind-production-report.csv";a.click();URL.revokeObjectURL(url);
  }

  const nav = [
    ["Dashboard",LayoutDashboard],["Production Tracking",ClipboardList],["Rejection Tracking",AlertTriangle],
    ...Object.entries(departments).map(([name,meta])=>[name,meta.icon]),["Management",Briefcase],["Reports",FileBarChart]
  ];
  const kpis = summary ? [
    ["Production target",num(summary.total_target),"Target quantity",Gauge],
    ["Actual production",num(summary.total_actual),"Produced quantity",Activity],
    ["Good quantity",num(summary.total_good),"Accepted parts",CheckCircle2],
    ["Rejection",num(summary.total_rejection),pct(summary.rejection_pct)+" rejection",AlertTriangle]
  ] : [];
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen?"open":""}`}>
      <div className="brand"><div className="brand-icon"><Factory size={23}/></div><div><b>FactoryMind <span>AI</span></b><small>by Webnora AI</small></div><button className="mobile-close" onClick={()=>setMobileOpen(false)}><X/></button></div>
      <div className="side-label">WORKSPACE</div>
      {nav.map(([label,Icon])=><button key={label} className={`nav-item ${page===label?"active":""}`} onClick={()=>{setPage(label);if(departments[label])setDeptForm({record_date:today,title:"",category:departments[label].categories[0],reference:"",status:departments[label].statuses[0],owner:"",quantity:0,remarks:""});setMobileOpen(false)}}><Icon size={18}/>{label}</button>)}
      <div className="sidebar-bottom"><div className="online-dot"/> Local factory workspace <small>No paid API connected</small></div>
    </aside>
    {mobileOpen && <div className="scrim" onClick={()=>setMobileOpen(false)}/>}
    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={()=>setMobileOpen(true)}><Menu/></button><div><div className="eyebrow">FACTORY OPERATIONS / {page.toUpperCase()}</div><h1>{page}</h1></div><div className="top-actions"><span className="local-pill"><span/> Local mode</span><button className="icon-btn" onClick={load} title="Refresh"><RefreshCw size={17}/></button></div></header>
      <div className="content">
        {error && <div className="alert error">{error}</div>}
        {notice && <div className="alert success">{notice}</div>}
        <section className="filters"><div><label>FROM DATE</label><input type="date" value={start} onChange={e=>setStart(e.target.value)}/></div><div><label>TO DATE</label><input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></div><button className="btn secondary" onClick={load}><RefreshCw size={15}/> Refresh</button></section>

        {page==="Dashboard" && <>
          <div className="welcome"><div><div className="eyebrow light">LIVE FACTORY SNAPSHOT</div><h2>Production at a glance</h2><p>Monitor output, good parts and rejection across your selected date range.</p></div><div className="welcome-mark"><Factory size={54}/></div></div>
          <div className="kpi-grid">{kpis.map(([label,value,sub,Icon])=><div className="kpi-card" key={label}><div className="kpi-top"><span>{label}</span><div className="kpi-icon"><Icon size={18}/></div></div><strong>{value}</strong><small>{sub}</small></div>)}</div>
          <div className="two-col">
            <div className="panel"><div className="panel-head"><div><h3>Daily production</h3><p>Actual quantity by date</p></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={summary?.daily_production||[]}><CartesianGrid strokeDasharray="3 3" stroke="#263449"/><XAxis dataKey="date" stroke="#93a4b8" tick={{fontSize:11}}/><YAxis stroke="#93a4b8" tick={{fontSize:11}}/><Tooltip contentStyle={{background:"#111d2d",border:"1px solid #304158",borderRadius:8}}/><Bar dataKey="quantity" fill="#36b5d8" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></div>
            <div className="panel"><div className="panel-head"><div><h3>Machine-wise output</h3><p>Actual quantity and rejection</p></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={summary?.machine_summary||[]}><CartesianGrid strokeDasharray="3 3" stroke="#263449"/><XAxis dataKey="machine" stroke="#93a4b8" tick={{fontSize:11}}/><YAxis stroke="#93a4b8" tick={{fontSize:11}}/><Tooltip contentStyle={{background:"#111d2d",border:"1px solid #304158",borderRadius:8}}/><Legend/><Bar dataKey="actual" name="Actual" fill="#36b5d8"/><Bar dataKey="rejection" name="Rejection" fill="#f16d70"/></BarChart></ResponsiveContainer></div></div>
          </div>
          <div className="panel"><div className="panel-head"><div><h3>Recent production entries</h3><p>Latest saved hourly records</p></div><button className="text-btn" onClick={()=>setPage("Production Tracking")}>View all →</button></div><ProductionTable rows={production.slice(0,6)} onDelete={remove}/></div>
          <div className="footnote">Figures are calculated from saved records. Add hourly production entries to populate this dashboard.</div>
        </>}

        {page==="Production Tracking" && <>
          <div className="section-intro"><div><h2>Hourly production entry</h2><p>Record machine output for each time slot and shift.</p></div></div>
          <form className="panel form-panel" onSubmit={submitProduction}><div className="form-grid">
            <Field label="Date"><input type="date" required value={prodForm.record_date} onChange={e=>setProdForm({...prodForm,record_date:e.target.value})}/></Field>
            <Field label="Shift"><select value={prodForm.shift} onChange={e=>setProdForm({...prodForm,shift:e.target.value})}><option>A</option><option>B</option><option>C</option></select></Field>
            <Field label="Time slot"><input required value={prodForm.time_slot} onChange={e=>setProdForm({...prodForm,time_slot:e.target.value})}/></Field>
            <Field label="Machine"><select value={prodForm.machine} onChange={e=>setProdForm({...prodForm,machine:e.target.value})}><option>VMC-01</option><option>VMC-02</option><option>Deep Hole Boring-01</option></select></Field>
            <Field label="Operator"><input required value={prodForm.operator} onChange={e=>setProdForm({...prodForm,operator:e.target.value})}/></Field>
            <Field label="Part name"><input required value={prodForm.part_name} onChange={e=>setProdForm({...prodForm,part_name:e.target.value})}/></Field>
            <Field label="Target quantity"><input type="number" min="0" required value={prodForm.target_qty} onChange={e=>setProdForm({...prodForm,target_qty:e.target.value})}/></Field>
            <Field label="Actual production"><input type="number" min="0" required value={prodForm.actual_qty} onChange={e=>setProdForm({...prodForm,actual_qty:e.target.value})}/></Field>
            <Field label="Rejection quantity"><input type="number" min="0" required value={prodForm.rejection_qty} onChange={e=>setProdForm({...prodForm,rejection_qty:e.target.value})}/></Field>
            <Field label="Remarks" wide><input value={prodForm.remarks} onChange={e=>setProdForm({...prodForm,remarks:e.target.value})} placeholder="Optional notes"/></Field>
          </div><div className="calculation-strip"><span>Good quantity <b>{Math.max(0,Number(prodForm.actual_qty||0)-Number(prodForm.rejection_qty||0))}</b></span><span>Achievement <b>{prodForm.target_qty>0?(prodForm.actual_qty/prodForm.target_qty*100).toFixed(1):"0.0"}%</b></span><span>Rejection <b>{prodForm.actual_qty>0?(prodForm.rejection_qty/prodForm.actual_qty*100).toFixed(2):"0.00"}%</b></span></div><button className="btn primary" type="submit"><Plus size={16}/> Save production record</button></form>
          <div className="panel"><div className="panel-head"><div><h3>Production history</h3><p>{production.length} records in selected date range</p></div></div><ProductionTable rows={production} onDelete={remove}/></div>
        </>}

        {page==="Rejection Tracking" && <>
          <div className="section-intro"><div><h2>Quality & rejection register</h2><p>Record defect details for quality analysis. This register is separate from rejection quantity entered with hourly production.</p></div></div>
          <form className="panel form-panel" onSubmit={submitRejection}><div className="form-grid">
            <Field label="Date"><input type="date" required value={rejForm.record_date} onChange={e=>setRejForm({...rejForm,record_date:e.target.value})}/></Field>
            <Field label="Shift"><select value={rejForm.shift} onChange={e=>setRejForm({...rejForm,shift:e.target.value})}><option>A</option><option>B</option><option>C</option></select></Field>
            <Field label="Machine"><select value={rejForm.machine} onChange={e=>setRejForm({...rejForm,machine:e.target.value})}><option>VMC-01</option><option>VMC-02</option><option>Deep Hole Boring-01</option></select></Field>
            <Field label="Part name"><input required value={rejForm.part_name} onChange={e=>setRejForm({...rejForm,part_name:e.target.value})}/></Field>
            <Field label="Defect type"><select value={rejForm.defect_type} onChange={e=>setRejForm({...rejForm,defect_type:e.target.value})}>{["Dimensional rejection","Hole size rejection","Thread rejection","Surface finish rejection","Burr","Tool mark","Casting defect","Other"].map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field label="Quantity"><input type="number" min="1" required value={rejForm.quantity} onChange={e=>setRejForm({...rejForm,quantity:e.target.value})}/></Field>
            <Field label="Operator"><input value={rejForm.operator} onChange={e=>setRejForm({...rejForm,operator:e.target.value})}/></Field>
            <Field label="Remarks"><input value={rejForm.remarks} onChange={e=>setRejForm({...rejForm,remarks:e.target.value})}/></Field>
          </div><button className="btn primary" type="submit"><Plus size={16}/> Save rejection record</button></form>
          <div className="panel"><div className="panel-head"><div><h3>Rejection history</h3><p>Defect-wise quality register</p></div></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Machine</th><th>Part</th><th>Defect</th><th>Qty</th><th>Operator</th><th></th></tr></thead><tbody>{rejections.map(r=><tr key={r.id}><td>{r.record_date}</td><td>{r.machine}</td><td>{r.part_name}</td><td>{r.defect_type}</td><td className="bad-text">{r.quantity}</td><td>{r.operator}</td><td><button className="delete-btn" onClick={()=>remove(`/api/rejections/${r.id}`)}><Trash2 size={15}/></button></td></tr>)}{!rejections.length&&<tr><td colSpan="7" className="empty">No rejection records in this date range.</td></tr>}</tbody></table></div></div>
        </>}

        {departments[page] && <DepartmentWorkspace page={page} meta={departments[page]} rows={departmentEntries.filter(x=>x.department===page)} form={deptForm} setForm={setDeptForm} onSubmit={submitDepartmentEntry} onDelete={remove} />}

        {page==="Management" && <>
          <div className="welcome"><div><div className="eyebrow light">FACTORY-WIDE OVERVIEW</div><h2>Department performance centre</h2><p>One view of activity recorded across all factory departments.</p></div><div className="welcome-mark"><Factory size={54}/></div></div>
          <div className="kpi-grid"><Kpi label="Production records" value={num(production.length)} note="Hourly entries" icon={Activity}/><Kpi label="Quality entries" value={num(departmentEntries.filter(x=>x.department==="Quality").length + rejections.length)} note="Quality and rejection logs" icon={ClipboardCheck}/><Kpi label="Open activities" value={num(departmentEntries.filter(x=>!['Closed','Completed','Delivered','Dispatched','Received'].includes(x.status)).length)} note="Across departments" icon={AlertTriangle}/><Kpi label="Departments active" value={num(new Set(departmentEntries.map(x=>x.department)).size)} note="With saved entries" icon={Boxes}/></div>
          <div className="dept-grid">{Object.entries(departments).map(([name,meta])=>{const rows=departmentEntries.filter(x=>x.department===name);const open=rows.filter(x=>!['Closed','Completed','Delivered','Dispatched','Received'].includes(x.status)).length;const Icon=meta.icon;return <button className="dept-card" key={name} onClick={()=>{setPage(name);setDeptForm({record_date:today,title:"",category:meta.categories[0],reference:"",status:meta.statuses[0],owner:"",quantity:0,remarks:""})}}><div className="dept-card-icon"><Icon size={21}/></div><div className="dept-card-title">{name}</div><p>{meta.subtitle}</p><div className="dept-card-foot"><span>{rows.length} records</span><b>{open} open</b></div></button>})}</div>
          <div className="panel"><div className="panel-head"><div><h3>Recent department activities</h3><p>Latest records across all departments</p></div></div><DepartmentTable rows={departmentEntries.slice(0,12)} onDelete={remove}/></div>
        </>}

        {page==="Reports" && <>
          <div className="section-intro"><div><h2>Production reports</h2><p>Basic report for your selected date range.</p></div><button className="btn primary" onClick={exportCSV}><FileBarChart size={16}/> Export production CSV</button></div>
          <div className="kpi-grid report-kpis">{kpis.map(([label,value,sub,Icon])=><div className="kpi-card" key={label}><div className="kpi-top"><span>{label}</span><div className="kpi-icon"><Icon size={18}/></div></div><strong>{value}</strong><small>{sub}</small></div>)}</div>
          <div className="panel"><div className="panel-head"><div><h3>Machine-wise report</h3><p>Production and rejection totals</p></div></div><div className="table-wrap"><table><thead><tr><th>Machine</th><th>Actual</th><th>Rejection</th><th>Good</th><th>Rejection %</th></tr></thead><tbody>{(summary?.machine_summary||[]).map(m=><tr key={m.machine}><td>{m.machine}</td><td>{num(m.actual)}</td><td className="bad-text">{num(m.rejection)}</td><td className="good-text">{num(m.actual-m.rejection)}</td><td>{pct(m.actual?m.rejection/m.actual*100:0)}</td></tr>)}{!summary?.machine_summary?.length&&<tr><td colSpan="5" className="empty">No data for this date range.</td></tr>}</tbody></table></div></div>
          <div className="panel"><div className="panel-head"><div><h3>Defect category report</h3><p>From the separate rejection register</p></div></div><div className="table-wrap"><table><thead><tr><th>Defect category</th><th>Rejected quantity</th></tr></thead><tbody>{(summary?.defect_summary||[]).map(d=><tr key={d.defect_type}><td>{d.defect_type}</td><td className="bad-text">{num(d.quantity)}</td></tr>)}{!summary?.defect_summary?.length&&<tr><td colSpan="2" className="empty">No defect entries in this date range.</td></tr>}</tbody></table></div></div>
        </>}
      </div>
      <footer>FactoryMind AI <span>•</span> Local MVP <span>•</span> Data stored in your local SQLite database</footer>
    </main>
  </div>;
}
function Field({label,children,wide}) {return <label className={`field ${wide?"wide":""}`}><span>{label}</span>{children}</label>}
function ProductionTable({rows,onDelete}) {
 return <div className="table-wrap"><table><thead><tr><th>Date</th><th>Shift / Time</th><th>Machine</th><th>Operator</th><th>Target</th><th>Actual</th><th>Reject</th><th>Good</th><th></th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.record_date}</td><td>{r.shift} / {r.time_slot}</td><td>{r.machine}</td><td>{r.operator}</td><td>{num(r.target_qty)}</td><td>{num(r.actual_qty)}</td><td className="bad-text">{num(r.rejection_qty)}</td><td className="good-text">{num(r.actual_qty-r.rejection_qty)}</td><td><button className="delete-btn" onClick={()=>onDelete(`/api/production/${r.id}`)} title="Delete"><Trash2 size={15}/></button></td></tr>)}{!rows.length&&<tr><td colSpan="9" className="empty">No production records in this date range. Add your first hourly entry.</td></tr>}</tbody></table></div>
}

function Kpi({label,value,note,icon:Icon}) {return <div className="kpi-card"><div className="kpi-top"><span>{label}</span><div className="kpi-icon"><Icon size={18}/></div></div><strong>{value}</strong><small>{note}</small></div>}
function DepartmentWorkspace({page,meta,rows,form,setForm,onSubmit,onDelete}) {
  const Icon=meta.icon;
  const update=(key,value)=>setForm({...form,[key]:value});
  return <>
    <div className="dept-hero"><div className="dept-hero-icon"><Icon size={27}/></div><div><h2>{page} workspace</h2><p>{meta.subtitle}</p></div><span className="dept-count">{rows.length} records</span></div>
    <form className="panel form-panel" onSubmit={onSubmit}><div className="panel-head"><div><h3>New {page} entry</h3><p>Save an activity, issue, request or task for this department.</p></div></div><div className="form-grid">
      <Field label="Date"><input type="date" required value={form.record_date} onChange={e=>update("record_date",e.target.value)}/></Field>
      <Field label="Activity / Title"><input required minLength="2" value={form.title} onChange={e=>update("title",e.target.value)} placeholder="Enter activity or issue"/></Field>
      <Field label="Category"><select value={form.category} onChange={e=>update("category",e.target.value)}>{meta.categories.map(x=><option key={x}>{x}</option>)}</select></Field>
      <Field label="Reference / Part / Machine"><input value={form.reference} onChange={e=>update("reference",e.target.value)} placeholder="e.g. VMC-01 / Part / PO no."/></Field>
      <Field label="Status"><select value={form.status} onChange={e=>update("status",e.target.value)}>{meta.statuses.map(x=><option key={x}>{x}</option>)}</select></Field>
      <Field label="Responsible person"><input value={form.owner} onChange={e=>update("owner",e.target.value)} placeholder="Name / team"/></Field>
      <Field label="Quantity (if applicable)"><input type="number" min="0" value={form.quantity} onChange={e=>update("quantity",e.target.value)}/></Field>
      <Field label="Remarks"><input value={form.remarks} onChange={e=>update("remarks",e.target.value)} placeholder="Details / action taken"/></Field>
    </div><button className="btn primary" type="submit"><Plus size={16}/> Save {page} entry</button></form>
    <div className="panel"><div className="panel-head"><div><h3>{page} register</h3><p>Saved records in the selected date range</p></div></div><DepartmentTable rows={rows} onDelete={onDelete}/></div>
  </>;
}
function DepartmentTable({rows,onDelete}) {return <div className="table-wrap"><table><thead><tr><th>Date</th><th>Department</th><th>Activity</th><th>Category</th><th>Reference</th><th>Status</th><th>Owner</th><th>Qty</th><th>Remarks</th><th></th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.record_date}</td><td>{r.department}</td><td>{r.title}</td><td>{r.category}</td><td>{r.reference||"—"}</td><td><span className={`status-pill ${['Closed','Completed','Delivered','Dispatched','Received'].includes(r.status)?'done':''}`}>{r.status}</span></td><td>{r.owner||"—"}</td><td>{num(r.quantity)}</td><td>{r.remarks||"—"}</td><td><button className="delete-btn" onClick={()=>onDelete(`/api/department-entries/${r.id}`)} title="Delete"><Trash2 size={15}/></button></td></tr>)}{!rows.length&&<tr><td colSpan="10" className="empty">No records yet. Add your first department entry above.</td></tr>}</tbody></table></div>}
