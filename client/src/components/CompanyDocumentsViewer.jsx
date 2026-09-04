import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  ExternalLink,
  Shield,
  BookOpen,
  Calendar,
  User,
  Tag,
  CheckCircle2,
  Lock,
  ChevronRight,
  Filter,
  FileCheck
} from 'lucide-react';
import { apiFetch } from '../services/api';

export default function CompanyDocumentsViewer({ resource }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeDoc, setActiveDoc] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/resources/documents/records');
      if (data && data.documents) {
        setDocuments(data.documents);
        if (data.documents.length > 0) {
          setActiveDoc(data.documents[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load documents records:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Security & Compliance', 'Operations & SOC', 'HR & Governance'];

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleDownloadDoc = (doc) => {
    const element = document.createElement('a');
    const file = new Blob([`# ${doc.title}\nID: ${doc.id}\nClassification: ${doc.classification}\nAuthor: ${doc.author}\nEffective Date: ${doc.effectiveDate}\n\n${doc.summary}\n\n${doc.content}`], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.id}_${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
          border: '1px solid rgba(14, 165, 233, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            }}
          >
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Enterprise Policy & Standards Repository
              </h3>
              <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                Zero-Trust Governed
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ISO/IEC 27001 Certified • SOC-2 Type II Control Framework • AES-256 Vault
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => activeDoc && handleDownloadDoc(activeDoc)}
            disabled={!activeDoc}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
          >
            <Download size={14} />
            <span>Export Active Doc</span>
          </button>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '380px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search policies, ISO standards, SOPs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', height: '36px', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory(cat)}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout: Master List (Left) & Document Reader (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(320px, 2fr)', gap: '14px', alignItems: 'stretch' }}>
        {/* Left: Document Index List */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '480px', overflowY: 'auto' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 6px' }}>
            Document Index ({filteredDocs.length})
          </span>

          {filteredDocs.map((doc) => {
            const isSelected = activeDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setActiveDoc(doc)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? 'var(--primary-light, rgba(56, 189, 248, 0.12))' : 'transparent',
                  border: isSelected ? '1px solid var(--primary, #38bdf8)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isSelected ? 'var(--primary, #38bdf8)' : 'var(--text-muted)' }}>
                    {doc.id} • {doc.version}
                  </span>
                  <span className="badge badge-info" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                    {doc.classification}
                  </span>
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {doc.title}
                </h4>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {doc.category}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Active Document Reader */}
        {activeDoc ? (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', maxHeight: '480px', overflowY: 'auto' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{activeDoc.id}</span>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{activeDoc.version}</span>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{activeDoc.classification}</span>
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                {activeDoc.title}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <User size={13} /> {activeDoc.author}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} /> Effective: {activeDoc.effectiveDate}
                </span>
              </div>
            </div>

            {/* Summary Box */}
            <div style={{ backgroundColor: 'var(--bg-app)', borderLeft: '3px solid var(--primary)', padding: '10px 14px', borderRadius: '4px', fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--text-secondary)', marginBottom: '16px' }}>
              <strong>Executive Summary:</strong> {activeDoc.summary}
            </div>

            {/* Document Body Markdown Simulation */}
            <div style={{ fontSize: '0.825rem', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
              {activeDoc.content}
            </div>

            {/* Tags footer */}
            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Tag size={12} style={{ color: 'var(--text-muted)' }} />
              {activeDoc.tags.map((tag) => (
                <span key={tag} className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Select a document from the index to view contents
          </div>
        )}
      </div>
    </div>
  );
}
