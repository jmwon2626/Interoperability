import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient.js";
import { 
  LayoutDashboard, FileText, AlertTriangle, Users, Calendar, HelpCircle, 
  UploadCloud, Paperclip, Search, Filter, Clock, CheckCircle, XCircle 
} from "lucide-react";

// --- 상수 및 설정 ---
const STATUS_COLORS = {
  "미착수": { bg: "#1e293b", text: "#94a3b8" },
  "작성중": { bg: "#1e3a8a", text: "#60a5fa" },
  "부분완료": { bg: "#422006", text: "#fb923c" },
  "초안완료": { bg: "#0f4a2f", text: "#4ade80" },
  "수정필요": { bg: "#4a0f0f", text: "#f87171" },
  "외부진행중": { bg: "#2e1065", text: "#a78bfa" },
  "완료": { bg: "#064e3b", text: "#10b981" }
};

const GROUPS = [
  "F/E", "Mobile", "B/E", "DB", "Infra", "DevOps", "Security", "QA", "RA", 
  "PMO", "Product", "UX/UI", "Clinical", "Data", "External Lab", "Meditrix", "BlueMit", "Executive", "Common"
];

// --- 훅: Supabase 데이터 동기화 ---
function useGmpData() {
  const [docs, setDocs] = useState([]);
  const [issues, setIssues] = useState([]);
  const [coops, setCoops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Realtime Subscriptions
    const subDocs = supabase.channel('docs').on('postgres_changes', { event: '*', schema: 'public', table: 'gmp_documents' }, fetchData).subscribe();
    const subIssues = supabase.channel('issues').on('postgres_changes', { event: '*', schema: 'public', table: 'gmp_issues' }, fetchData).subscribe();
    
    return () => { supabase.removeChannel(subDocs); supabase.removeChannel(subIssues); };
  }, []);

  async function fetchData() {
    try {
      const [docRes, issueRes, coopRes] = await Promise.all([
        supabase.from('gmp_documents').select('*').order('id'),
        supabase.from('gmp_issues').select('*').order('due_date'),
        supabase.from('gmp_cooperations').select('*').order('created_at', { ascending: false })
      ]);
      setDocs(docRes.data || []);
      setIssues(issueRes.data || []);
      setCoops(coopRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const updateDoc = async (id, updates) => {
    await supabase.from('gmp_documents').update(updates).eq('id', id);
  };

  return { docs, issues, coops, loading, updateDoc, fetchData };
}

// --- 메인 컴포넌트 ---
export default function App() {
  const { docs, issues, coops, loading, updateDoc, fetchData } = useGmpData();
  const [view, setView] = useState("dashboard");
  const [selectedDoc, setSelectedDoc] = useState(null);

  if (loading) return <div className="loading-screen">데이터 로딩 중...</div>;

  return (
    <div className="app-container">
      {/* 사이드바 / 네비게이션 */}
      <nav className="sidebar">
        <div className="logo">
          <h2>SaMD GMP<br/><span>QMS-PMS</span></h2>
        </div>
        <div className="menu">
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><LayoutDashboard size={18}/> 통합 대시보드</button>
          <button className={view === "docs" ? "active" : ""} onClick={() => setView("docs")}><FileText size={18}/> 문서 작성 관리</button>
          <button className={view === "groups" ? "active" : ""} onClick={() => setView("groups")}><Users size={18}/> 업무군별 보드</button>
          <button className={view === "issues" ? "active" : ""} onClick={() => setView("issues")}><AlertTriangle size={18}/> 이슈 & 리스크</button>
          <button className={view === "coop" ? "active" : ""} onClick={() => setView("coop")}><HelpCircle size={18}/> 협조 요청</button>
          <button className={view === "milestones" ? "active" : ""} onClick={() => setView("milestones")}><Calendar size={18}/> 마일스톤</button>
        </div>
      </nav>

      {/* 메인 콘텐츠 영역 */}
      <main className="content">
        <header className="top-header">
          <h1>
            {view === "dashboard" && "통합 진행현황 대시보드"}
            {view === "docs" && "GMP 인증 산출물 및 문서 관리"}
            {view === "groups" && "업무군(부서)별 작업 보드"}
            {view === "issues" && "이슈 및 리스크 트래킹"}
            {view === "coop" && "크로스펑셔널 협조 요청"}
            {view === "milestones" && "주요 마일스톤 (Milestones)"}
          </h1>
          <div className="header-meta">
            <span>마감일 준수율: {Math.round(docs.filter(d=>d.status === '완료').length / docs.length * 100)}%</span>
            <span className="critical-badge">Critical 이슈: {issues.filter(i=>i.severity==='Critical' && i.status==='Open').length}건</span>
          </div>
        </header>

        <div className="view-container">
          {view === "dashboard" && <DashboardView docs={docs} issues={issues} />}
          {view === "docs" && <DocumentView docs={docs} onSelect={setSelectedDoc} />}
          {view === "groups" && <GroupBoardView docs={docs} issues={issues} />}
          {view === "issues" && <IssueView issues={issues} />}
          {view === "coop" && <CoopView coops={coops} />}
          {view === "milestones" && <MilestoneView />}
        </div>
      </main>

      {/* 문서 상세 및 파일 업로드 모달 */}
      {selectedDoc && (
        <DocumentModal 
          doc={selectedDoc} 
          onClose={() => setSelectedDoc(null)} 
          onUpdate={(updates) => { updateDoc(selectedDoc.id, updates); setSelectedDoc({...selectedDoc, ...updates}); }}
        />
      )}
      
      {/* 인라인 CSS (복사-붙여넣기 배포를 위해 포함) */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Noto Sans KR', sans-serif; }
        body { background: #060d1a; color: #f1f5f9; }
        .app-container { display: flex; height: 100vh; overflow: hidden; }
        
        .sidebar { width: 240px; background: #0a1628; border-right: 1px solid #1e293b; display: flex; flex-direction: column; }
        .logo { padding: 24px; border-bottom: 1px solid #1e293b; }
        .logo h2 { font-size: 18px; color: #38bdf8; letter-spacing: -0.5px; }
        .logo span { font-size: 12px; color: #64748b; }
        .menu { display: flex; flex-direction: column; padding: 16px 12px; gap: 4px; }
        .menu button { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: transparent; border: none; color: #94a3b8; font-size: 14px; text-align: left; border-radius: 8px; cursor: pointer; transition: 0.2s; }
        .menu button:hover { background: #1e293b; color: #fff; }
        .menu button.active { background: #0ea5e9; color: #fff; font-weight: 600; }
        
        .content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .top-header { padding: 24px 32px; background: #081020; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
        .top-header h1 { font-size: 20px; font-weight: 700; color: #f8fafc; }
        .header-meta { display: flex; gap: 16px; font-size: 13px; font-weight: 600; }
        .critical-badge { background: #450a0a; color: #fca5a5; padding: 4px 10px; border-radius: 20px; border: 1px solid #7f1d1d; }
        
        .view-container { flex: 1; overflow-y: auto; padding: 24px 32px; }
        
        /* Dashboard */
        .dash-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .kpi-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 20px; }
        .kpi-value { font-size: 32px; font-weight: 800; margin-top: 8px; color: #fff; }
        
        /* Table */
        .data-table { width: 100%; border-collapse: collapse; background: #0f172a; border-radius: 8px; overflow: hidden; font-size: 13px; }
        .data-table th { background: #1e293b; color: #94a3b8; padding: 12px 16px; text-align: left; font-weight: 600; }
        .data-table td { padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
        .data-table tr:hover td { background: #1a2235; cursor: pointer; }
        
        /* Status Badge */
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
        .group-tag { display: inline-block; background: #334155; color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin: 2px; }
        
        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 100; }
        .modal-content { background: #0f172a; width: 900px; max-height: 90vh; border-radius: 12px; border: 1px solid #334155; display: flex; flex-direction: column; overflow: hidden; }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; background: #081020; }
        .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
        .tabs { display: flex; border-bottom: 1px solid #334155; margin-bottom: 20px; }
        .tab { padding: 10px 20px; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab.active { color: #38bdf8; border-bottom-color: #38bdf8; font-weight: 600; }
        
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .form-group label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
        .form-control { width: 100%; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px; border-radius: 6px; }
        
        /* File Upload Area */
        .file-upload-area { border: 2px dashed #334155; border-radius: 8px; padding: 30px; text-align: center; background: #0a101d; margin-top: 10px; cursor: pointer; }
        .file-upload-area:hover { border-color: #38bdf8; background: #0c1a2e; }
        
        /* Group Board */
        .board-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .board-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; }
      `}</style>
    </div>
  );
}

// --- 하위 뷰 컴포넌트들 ---

function DashboardView({ docs, issues }) {
  const total = docs.length;
  const done = docs.filter(d => d.status === '완료').length;
  const inProgress = docs.filter(d => ['작성중', '부분완료', '초안완료', '수정필요'].includes(d.status)).length;
  const notStarted = docs.filter(d => d.status === '미착수').length;
  const avgProgress = total === 0 ? 0 : Math.round(docs.reduce((acc, d) => acc + d.progress, 0) / total);

  return (
    <div>
      <div className="dash-grid">
        <div className="kpi-card">
          <div style={{color: '#94a3b8', fontSize: 13}}>전체 문서 진행률</div>
          <div className="kpi-value" style={{color: '#38bdf8'}}>{avgProgress}%</div>
        </div>
        <div className="kpi-card">
          <div style={{color: '#94a3b8', fontSize: 13}}>작성 완료</div>
          <div className="kpi-value" style={{color: '#4ade80'}}>{done} / {total}건</div>
        </div>
        <div className="kpi-card">
          <div style={{color: '#94a3b8', fontSize: 13}}>진행 중 / 보완 필요</div>
          <div className="kpi-value" style={{color: '#fbbf24'}}>{inProgress}건</div>
        </div>
        <div className="kpi-card" style={{border: '1px solid #7f1d1d', background: '#2a0e0e'}}>
          <div style={{color: '#fca5a5', fontSize: 13}}>미착수 (지연 위험)</div>
          <div className="kpi-value" style={{color: '#f87171'}}>{notStarted}건</div>
        </div>
      </div>
      
      <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px'}}>
        <div className="kpi-card">
          <h3 style={{marginBottom: 16, fontSize: 15}}>🔥 긴급 대응 필요 이슈 (Critical / High)</h3>
          <table className="data-table">
            <tbody>
              {issues.filter(i => ['Critical', 'High'].includes(i.severity) && i.status === 'Open').map(issue => (
                <tr key={issue.id}>
                  <td style={{width: '80px', color: '#f87171', fontWeight: 'bold'}}>{issue.id}</td>
                  <td>{issue.title}</td>
                  <td style={{color: '#fca5a5'}}>{issue.due_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="kpi-card">
          <h3 style={{marginBottom: 16, fontSize: 15}}>⚠️ 마감 임박 문서 (5/13 기준)</h3>
          <ul style={{listStyle: 'none', padding: 0}}>
            {docs.filter(d => d.due_date && d.due_date <= '2025-05-15' && d.status !== '완료').map(doc => (
              <li key={doc.id} style={{padding: '10px', background: '#1e293b', marginBottom: '8px', borderRadius: '6px', fontSize: 13}}>
                <div style={{color: '#fbbf24', fontWeight: 'bold', marginBottom: '4px'}}>{doc.due_date} 마감</div>
                <div>{doc.id}: {doc.title}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function DocumentView({ docs, onSelect }) {
  const [filterCat, setFilterCat] = useState("전체");
  const categories = ["전체", ...new Set(docs.map(d => d.category))];

  const filtered = docs.filter(d => filterCat === "전체" || d.category === filterCat);

  return (
    <div>
      <div style={{display: 'flex', gap: 10, marginBottom: 20}}>
        <select className="form-control" style={{width: 200}} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{display:'flex', alignItems:'center', color:'#94a3b8', fontSize:13}}>
          총 {filtered.length}건
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>문서 카테고리</th>
            <th>문서/산출물명</th>
            <th>담당 그룹</th>
            <th>상태</th>
            <th>진행률</th>
            <th>마감일</th>
            <th>파일</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(doc => (
            <tr key={doc.id} onClick={() => onSelect(doc)}>
              <td style={{color: '#38bdf8', fontWeight: 600, fontFamily: 'monospace'}}>{doc.id}</td>
              <td style={{fontSize: 12}}>{doc.category}</td>
              <td style={{fontWeight: 500, color: '#f8fafc'}}>{doc.title}</td>
              <td>
                {doc.assigned_groups?.map(g => <span key={g} className="group-tag">{g}</span>)}
              </td>
              <td>
                <span className="status-badge" style={{background: STATUS_COLORS[doc.status]?.bg || '#000', color: STATUS_COLORS[doc.status]?.text || '#fff'}}>
                  {doc.status}
                </span>
              </td>
              <td>
                <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                  <div style={{width: 60, height: 6, background: '#1e293b', borderRadius: 3}}>
                    <div style={{width: `${doc.progress}%`, height: '100%', background: '#0ea5e9', borderRadius: 3}}/>
                  </div>
                  <span style={{fontSize: 11, color: '#94a3b8'}}>{doc.progress}%</span>
                </div>
              </td>
              <td style={{color: '#f87171', fontSize: 12}}>{doc.due_date || '-'}</td>
              <td>{doc.file_count > 0 ? <Paperclip size={14} color="#38bdf8"/> : <span style={{color: '#475569'}}>-</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocumentModal({ doc, onClose, onUpdate }) {
  const [tab, setTab] = useState("basic");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // 파일 목록 로드 (Supabase Storage)
  useEffect(() => {
    if (tab === 'files') loadFiles();
  }, [tab]);

  async function loadFiles() {
    const { data, error } = await supabase.storage.from('gmp_files').list(doc.id);
    if (!error && data) setFiles(data);
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const path = `${doc.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('gmp_files').upload(path, file);
    if (!error) {
      await loadFiles();
      onUpdate({ file_count: (doc.file_count || 0) + 1 });
    } else {
      alert("파일 업로드 실패: " + error.message);
    }
    setUploading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span style={{color: '#38bdf8', fontSize: 12, fontWeight: 700, marginRight: 10}}>{doc.id}</span>
            <span style={{fontSize: 18, fontWeight: 700, color: '#fff'}}>{doc.title}</span>
          </div>
          <button onClick={onClose} style={{background:'none', border:'none', color:'#94a3b8', cursor:'pointer'}}><XCircle size={24}/></button>
        </div>
        
        <div style={{background: '#0a101d', padding: '0 24px'}}>
          <div className="tabs">
            <div className={`tab ${tab==='basic'?'active':''}`} onClick={()=>setTab('basic')}>기본 정보 및 상태변경</div>
            <div className={`tab ${tab==='files'?'active':''}`} onClick={()=>setTab('files')}>증빙 파일 첨부 ({doc.file_count || 0})</div>
          </div>
        </div>

        <div className="modal-body">
          {tab === 'basic' && (
            <div>
              <div className="form-grid">
                <div className="form-group">
                  <label>현재 상태</label>
                  <select className="form-control" value={doc.status} onChange={e => onUpdate({status: e.target.value})}>
                    {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>진행률 (%)</label>
                  <input type="number" className="form-control" value={doc.progress} onChange={e => onUpdate({progress: parseInt(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>담당 그룹 (Multi-select 구현 예정)</label>
                  <input type="text" className="form-control" value={doc.assigned_groups?.join(', ')} readOnly />
                </div>
                <div className="form-group">
                  <label>마감일</label>
                  <input type="date" className="form-control" value={doc.due_date || ''} onChange={e => onUpdate({due_date: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>업무 메모 / 잔여 과업</label>
                <textarea className="form-control" rows={4} value={doc.description || ''} onChange={e => onUpdate({description: e.target.value})} placeholder="여기에 회의록 내용이나 다음 액션을 기재하세요..."/>
              </div>
            </div>
          )}

          {tab === 'files' && (
            <div>
              <div style={{color: '#94a3b8', fontSize: 13, marginBottom: 16}}>
                GMP 심사를 위한 최종 산출물(PDF), 설계도, 엑셀 파일 등을 업로드하세요.
              </div>
              
              <table className="data-table" style={{marginBottom: 20}}>
                <thead>
                  <tr><th>파일명</th><th>업로드 시간</th><th>크기</th></tr>
                </thead>
                <tbody>
                  {files.length === 0 ? <tr><td colSpan={3} style={{textAlign:'center'}}>첨부된 파일이 없습니다.</td></tr> : null}
                  {files.map(f => (
                    <tr key={f.name}>
                      <td style={{color: '#38bdf8'}}>{f.name.split('_').slice(1).join('_')}</td>
                      <td>{new Date(f.created_at).toLocaleString()}</td>
                      <td>{(f.metadata.size / 1024).toFixed(1)} KB</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <label className="file-upload-area" style={{display: 'block'}}>
                <UploadCloud size={32} color="#38bdf8" style={{marginBottom: 10}}/>
                <div style={{color: '#f8fafc', fontWeight: 600}}>클릭하여 파일 선택 및 업로드</div>
                <div style={{color: '#64748b', fontSize: 12, marginTop: 5}}>PDF, DOCX, XLSX, PNG (최대 50MB)</div>
                <input type="file" style={{display:'none'}} onChange={handleFileUpload} disabled={uploading} />
              </label>
              {uploading && <div style={{textAlign: 'center', color: '#0ea5e9', marginTop: 10}}>업로드 중...</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GroupBoardView({ docs }) {
  // 현재 문서들이 배정된 그룹들만 추출
  const activeGroups = GROUPS.filter(g => docs.some(d => d.assigned_groups?.includes(g)));

  return (
    <div className="board-grid">
      {activeGroups.map(group => {
        const groupDocs = docs.filter(d => d.assigned_groups?.includes(group));
        const done = groupDocs.filter(d => d.status === '완료').length;
        
        return (
          <div key={group} className="board-card">
            <h3 style={{fontSize: 16, borderBottom: '1px solid #1e293b', paddingBottom: 10, marginBottom: 10, color: '#38bdf8'}}>
              {group} <span style={{fontSize: 12, color: '#64748b', float: 'right'}}>{done}/{groupDocs.length} 완료</span>
            </h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
              {groupDocs.map(doc => (
                <div key={doc.id} style={{background: '#081020', padding: '10px', borderRadius: '6px', borderLeft: doc.status === '완료' ? '3px solid #10b981' : '3px solid #fbbf24'}}>
                  <div style={{fontSize: 11, color: '#94a3b8', marginBottom: 4}}>{doc.id}</div>
                  <div style={{fontSize: 13, color: '#f1f5f9'}}>{doc.title}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IssueView({ issues }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>이슈 ID</th>
          <th>심각도</th>
          <th>제목 및 내용</th>
          <th>담당 그룹</th>
          <th>기한</th>
          <th>상태</th>
        </tr>
      </thead>
      <tbody>
        {issues.map(iss => (
          <tr key={iss.id}>
            <td style={{fontWeight: 'bold', color: '#f1f5f9'}}>{iss.id}</td>
            <td>
              <span className="status-badge" style={{background: iss.severity === 'Critical' ? '#7f1d1d' : iss.severity === 'High' ? '#9a3412' : '#0f766e', color: '#fff'}}>
                {iss.severity}
              </span>
            </td>
            <td>
              <div style={{fontWeight: 600, color: '#f8fafc', marginBottom: 4}}>{iss.title}</div>
              <div style={{fontSize: 11, color: '#94a3b8'}}>{iss.description}</div>
              {iss.decisions_needed && <div style={{fontSize: 11, color: '#fbbf24', marginTop: 4}}>💡 의사결정 필요: {iss.decisions_needed}</div>}
            </td>
            <td>{iss.assigned_groups?.map(g => <span key={g} className="group-tag">{g}</span>)}</td>
            <td style={{color: '#f87171'}}>{iss.due_date}</td>
            <td>{iss.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CoopView({ coops }) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
      <div style={{background: '#1e293b', padding: '16px', borderRadius: '8px', color: '#cbd5e1', fontSize: 13}}>
        <strong>크로스펑셔널 협조 요청이란?</strong> 특정 문서/산출물을 작성하기 위해 타 부서의 데이터, 아키텍처, 검토가 필요할 때 기록하는 보드입니다.
      </div>
      {coops.map(c => (
        <div key={c.id} style={{background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '20px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 12}}>
            <h3 style={{fontSize: 16, color: '#38bdf8'}}>{c.title}</h3>
            <span className="status-badge" style={{background: '#0ea5e9', color: '#fff'}}>{c.status}</span>
          </div>
          <div style={{display: 'flex', gap: 12, fontSize: 12, marginBottom: 16}}>
            <span style={{background: '#1e293b', padding: '4px 8px', borderRadius: '4px'}}>요청: <strong>{c.req_group}</strong></span>
            <span style={{color: '#94a3b8', alignSelf: 'center'}}>▶</span>
            <span style={{background: '#3f1a3b', color: '#f472b6', padding: '4px 8px', borderRadius: '4px'}}>수신: <strong>{c.res_group}</strong></span>
            <span style={{marginLeft: 'auto', color: '#f87171'}}>마감: {c.due_date}</span>
          </div>
          <p style={{fontSize: 13, color: '#cbd5e1', lineHeight: 1.6}}>{c.description}</p>
        </div>
      ))}
    </div>
  );
}

function MilestoneView() {
  const milestones = [
    { date: "2025.05.06", title: "기초 문서 1차 작성 완료", status: "done" },
    { date: "2025.05.09", title: "조직 구성 확정 및 문서 승인 체계 수립 (ISSUE-001 해결)", status: "active" },
    { date: "2025.05.13", title: "제품표준서(DMR) 초안 전달 (CRITICAL)", status: "pending" },
    { date: "2025.05.20", title: "사용자 매뉴얼 3종 및 품질매뉴얼 수정 완료", status: "pending" },
    { date: "2025.05.29", title: "신청 문서 + IEC 62304 템플릿 29종 초안 완료", status: "pending" },
    { date: "TBD", title: "내부 심사 (Internal Audit) 및 시정조치", status: "pending" },
    { date: "TBD", title: "식약처/인증기관 GMP 심사 신청", status: "pending" },
  ];

  return (
    <div style={{padding: '20px 40px'}}>
      {milestones.map((m, i) => (
        <div key={i} style={{display: 'flex', gap: 20, marginBottom: 30, position: 'relative'}}>
          {i !== milestones.length - 1 && <div style={{position: 'absolute', left: 15, top: 40, bottom: -30, width: 2, background: '#1e293b'}}/>}
          <div style={{
            width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
            background: m.status === 'done' ? '#10b981' : m.status === 'active' ? '#0ea5e9' : '#1e293b',
            color: '#fff', fontWeight: 'bold', fontSize: 14
          }}>
            {m.status === 'done' ? '✓' : i + 1}
          </div>
          <div style={{paddingTop: 4}}>
            <div style={{fontSize: 12, color: m.status==='active' ? '#38bdf8' : '#94a3b8', fontWeight: 'bold', marginBottom: 4}}>{m.date}</div>
            <div style={{fontSize: 16, color: '#f1f5f9', fontWeight: 600}}>{m.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
}