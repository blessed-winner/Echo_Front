import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn, formatDisplayDate, parseApiDate, stripHtml } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { api } from '../lib/api';
import { EchoToast } from '../components/EchoToast';

interface TopicDto {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by GET /notes (MapStruct NoteDto). */
interface ApiNoteDto {
  id: number;
  title: string;
  content: string;
  createdAt?: string | number[];
  updatedAt?: string | number[];
  topic?: { id: number; name: string } | null;
}

interface NoteDto {
  id: number;
  title: string;
  content: string;
  topicId: number | null;
  topicName: string | null;
  createdAt: string | number[];
  updatedAt?: string | number[];
}

const normalizeNote = (raw: ApiNoteDto): NoteDto => ({
  id: raw.id,
  title: raw.title,
  content: raw.content,
  createdAt: raw.createdAt ?? '',
  updatedAt: raw.updatedAt,
  topicId: raw.topic?.id ?? null,
  topicName: raw.topic?.name ?? null,
});

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

const Library: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken, isAuthLoading } = useUser();
  const [topics, setTopics] = useState<TopicDto[]>([]);
  const [recentNotes, setRecentNotes] = useState<NoteDto[]>([]);
  const [totalTopics, setTotalTopics] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [editingTopic, setEditingTopic] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [shareToast, setShareToast] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTopics = async () => {
      if (isAuthLoading || !accessToken) return;
      setIsLoading(true);
      try {
        const response = await api.get<PageResponse<TopicDto>>('/topics?page=0&size=100');
        if (isMounted) {
          setTopics(response.data?.content || []);
          setTotalTopics(response.data?.totalElements || 0);
        }
      } catch (error) {
        console.error('Failed to load topics:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTopics();
    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthLoading]);

  useEffect(() => {
    let isMounted = true;

    const loadNotes = async () => {
      if (isAuthLoading || !accessToken) return;
      setIsNotesLoading(true);
      try {
        let response;
        if (selectedTopicId === null) {
          response = await api.get<PageResponse<ApiNoteDto>>('/notes?page=0&size=100');
        } else {
          response = await api.get<PageResponse<ApiNoteDto>>(`/topics/${selectedTopicId}/notes?page=0&size=100`);
        }
        if (isMounted) {
          const notesContent = response.data?.content
            ? (Array.isArray(response.data.content) ? response.data.content.map(normalizeNote) : [])
            : [];
          setRecentNotes(notesContent);
          if (selectedTopicId === null) {
            setTotalNotes(response.data?.totalElements || 0);
          }
        }
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        if (isMounted) {
          setIsNotesLoading(false);
        }
      }
    };

    void loadNotes();
    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthLoading, selectedTopicId]);


  const getTopicIcon = (index: number) => {
    const icons = ['terminal', 'translate', 'medical_services', 'palette', 'account_balance', 'science', 'psychology', 'book'];
    return icons[index % icons.length];
  };

  const getTopicColor = (index: number) => {
    const colors = [
      { bg: 'bg-indigo-50', text: 'text-indigo-600', badge: 'text-indigo-400 bg-indigo-50' },
      { bg: 'bg-[#f1f7f4]', text: 'text-[#3c6752]', badge: 'text-[#3c6752] bg-[#f1f7f4]' },
      { bg: 'bg-slate-50', text: 'text-slate-500', badge: 'text-slate-400 bg-slate-50' },
      { bg: 'bg-purple-50', text: 'text-purple-600', badge: 'text-purple-400 bg-purple-50' },
      { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'text-amber-400 bg-amber-50' },
    ];
    return colors[index % colors.length];
  };

  const getNoteLastUpdatedDisplay = (note: NoteDto) => {
    const created = parseApiDate(note.createdAt);
    const updated = note.updatedAt != null ? parseApiDate(note.updatedAt) : null;
    if (updated && created && updated.getTime() > created.getTime()) {
      return formatDisplayDate(note.updatedAt);
    }
    return formatDisplayDate(note.createdAt);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    if (diffWeeks < 4) return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleEditTopic = (topic: TopicDto) => {
    setEditingTopic(topic.id);
    setEditName(topic.name);
    setEditDescription(topic.description || '');
  };

  const handleSaveTopic = async (topicId: number) => {
    try {
      await api.put(`/topics/${topicId}`, {
        name: editName,
        description: editDescription || null
      });
      
      // Update local state
      setTopics(prev => prev.map(t => 
        t.id === topicId 
          ? { ...t, name: editName, description: editDescription || null }
          : t
      ));
      
      setEditingTopic(null);
      console.log('Topic updated successfully');
    } catch (error) {
      console.error('Failed to update topic:', error);
      alert('Failed to update topic. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingTopic(null);
    setEditName('');
    setEditDescription('');
  };

  const handleShareNote = async (note: NoteDto) => {
    const shareText = [
      stripHtml(note.title) || 'Untitled note',
      stripHtml(note.content) || 'No content yet',
      note.topicName ? `Topic: ${note.topicName}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      if (navigator.share) {
        await navigator.share({
          title: stripHtml(note.title) || 'Echo note',
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setShareToast('Note summary copied to clipboard.');
      }
    } catch {
      setShareToast('Could not share this note right now.');
    } finally {
      window.setTimeout(() => setShareToast(null), 3000);
    }
  };

  const handleTopicClick = (topicId: number) => {
    setSelectedTopicId(prev => prev === topicId ? null : topicId);
  };

  return (
    <div className="max-w-[1200px] mx-auto p-gutter space-y-gutter animate-in fade-in duration-700 pb-24">
      {shareToast && (
        <div className="sticky top-4 z-50 max-w-md mx-auto">
          <EchoToast message={shareToast} variant="info" onDismiss={() => setShareToast(null)} />
        </div>
      )}
      {/* Header Section — Editorial Style */}
      <div className="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 animate-in slide-in-from-left duration-700">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-[#182442]/40 uppercase tracking-[0.2em]">Knowledge Archive</span>
            </div>
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-4xl text-[#182442]/90 font-medium leading-tight mb-2">
            Topics & <span className="italic">Notes</span>
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-[15px] text-slate-400 max-w-xl">
            Your knowledge landscape, organized by <span className="text-[#182442]/60 font-medium">cognitive domains</span> and retention priority.
          </p>
        </div>
        <div className="flex gap-3">
          {isLoading ? (
            <>
              <span className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-400 flex items-center gap-2 shadow-sm animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Loading...
              </span>
              <span className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-400 flex items-center gap-2 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Loading...
              </span>
            </>
          ) : (
            <>
              <span className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-[#3c6752] flex items-center gap-2 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3c6752]"></span> {totalTopics} Active Topics
              </span>
              <span className="px-4 py-2 bg-[#182442] rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-[#182442]/10">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span> {totalNotes} Total Notes
              </span>
            </>
          )}
        </div>
      </div>

      {/* Bento Grid of Topics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {isLoading ? (
          <>
            {/* Loading skeletons */}
            <div className="col-span-12 md:col-span-8 bg-slate-50 border border-slate-200 rounded-xl p-6 min-h-[320px] animate-pulse"></div>
            <div className="col-span-12 md:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-6 min-h-[280px] animate-pulse"></div>
            <div className="col-span-12 md:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-6 h-48 animate-pulse"></div>
            <div className="col-span-12 md:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-6 h-48 animate-pulse"></div>
            <div className="col-span-12 md:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-6 h-48 animate-pulse"></div>
          </>
        ) : !topics || topics.length === 0 ? (
          /* Empty state */
          <div className="col-span-12 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined !text-5xl text-slate-300">folder_open</span>
            </div>
            <h3 className="text-2xl font-bold text-[#182442] mb-3 font-manrope">No Topics Yet</h3>
            <p className="text-slate-500 mb-8 max-w-md leading-relaxed">
              Topics help you organize your knowledge into meaningful categories. Create your first topic to get started.
            </p>
            <button 
              onClick={() => navigate('/new', { state: { createNewTopic: true } })}
              className="bg-[#182442] text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-[#182442]/10 flex items-center gap-2"
            >
              <Plus size={20} />
              Create First Topic
            </button>
          </div>
        ) : (
          <>
            {/* First topic - Large Featured */}
            {topics[0] && (
              <div 
                onClick={() => handleTopicClick(topics[0].id)}
                className={cn(
                  "col-span-12 md:col-span-8 bg-white border rounded-xl p-6 transition-all group flex flex-col justify-between min-h-[320px] shadow-sm cursor-pointer",
                  selectedTopicId === topics[0].id 
                    ? "border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/10 hover:border-indigo-600" 
                    : "border-slate-200 hover:border-indigo-500/20"
                )}
              >
                {editingTopic === topics[0].id ? (
                  /* Edit Mode */
                  <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Topic Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-lg font-bold focus:ring-2 focus:ring-[#182442]/20 focus:border-[#182442] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Description</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={4}
                        placeholder="Add a description for this topic..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#182442]/20 focus:border-[#182442] outline-none resize-none"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleSaveTopic(topics[0].id)}
                        className="bg-[#182442] text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-all"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-white border border-slate-200 text-slate-600 px-6 py-2 rounded-lg font-bold hover:bg-slate-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div className="flex justify-between items-start">
                      <div className={cn("p-3 rounded-xl", getTopicColor(0).bg)}>
                        <span className={cn("material-symbols-outlined !text-3xl", getTopicColor(0).text)}>{getTopicIcon(0)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTopic(topics[0]);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-[#182442]"
                          title="Edit topic"
                        >
                          <span className="material-symbols-outlined !text-[20px]">edit</span>
                        </button>
                        <span className="inline-flex items-center justify-center shrink-0 h-4 text-[9px] font-bold leading-[10px] px-1.5 rounded-md uppercase tracking-widest bg-[#182442]/8 text-[#182442] border border-[#182442]/10">
                          Priority
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-primary mb-2 font-manrope">{topics[0].name}</h3>
                      {topics[0].description ? (
                        <p className="text-[16px] text-on-surface-variant line-clamp-2 max-w-lg leading-relaxed">
                          {topics[0].description}
                        </p>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTopic(topics[0]);
                          }}
                          className="text-[16px] text-slate-400 italic hover:text-[#182442] transition-colors text-left"
                        >
                          Click to add description...
                        </button>
                      )}
                      <div className="mt-8 flex items-center gap-12">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">TOPIC</p>
                          <p className="font-bold text-primary">Active</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">CREATED</p>
                          <p className="text-sm font-medium text-slate-600">{formatDate(topics[0].createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Second topic - Secondary Card */}
            {topics[1] && (
              <div 
                onClick={() => handleTopicClick(topics[1].id)}
                className={cn(
                  "col-span-12 md:col-span-4 bg-white border rounded-xl p-6 transition-all group flex flex-col justify-between shadow-sm cursor-pointer",
                  selectedTopicId === topics[1].id 
                    ? "border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/10 hover:border-indigo-600" 
                    : "border-slate-200 hover:border-indigo-500/20"
                )}
              >
                {editingTopic === topics[1].id ? (
                  <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Topic Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-lg font-bold focus:ring-2 focus:ring-[#182442]/20 focus:border-[#182442] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Description</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={4}
                        placeholder="Add a description for this topic..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#182442]/20 focus:border-[#182442] outline-none resize-none"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleSaveTopic(topics[1].id)}
                        className="bg-[#182442] text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-all"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-white border border-slate-200 text-slate-600 px-6 py-2 rounded-lg font-bold hover:bg-slate-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className={cn("p-3 rounded-xl inline-block", getTopicColor(1).bg)}>
                        <span className={cn("material-symbols-outlined !text-2xl", getTopicColor(1).text)}>{getTopicIcon(1)}</span>
                      </div>
                      <h3 className="text-xl font-bold text-primary mt-4 mb-1 font-manrope">{topics[1].name}</h3>
                      {topics[1].description ? (
                        <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
                          {topics[1].description}
                        </p>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTopic(topics[1]);
                          }}
                          className="text-sm text-slate-400 italic hover:text-[#182442] transition-colors text-left"
                        >
                          Add description...
                        </button>
                      )}
                    </div>
                    <div className="pt-6 flex items-center justify-between">
                      <p className="text-xs text-slate-500 font-medium">Created {formatDate(topics[1].createdAt)}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTopic(topics[1]);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-[#182442]"
                        title="Edit topic"
                      >
                        <span className="material-symbols-outlined !text-[18px]">edit</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Remaining topics - Small Cards */}
            {topics.slice(2).map((topic, index) => {
              const colorIndex = index + 2;
              return (
                <div 
                  key={topic.id} 
                  onClick={() => handleTopicClick(topic.id)}
                  className={cn(
                    "col-span-12 md:col-span-4 bg-white border rounded-xl p-6 transition-all group shadow-sm cursor-pointer",
                    selectedTopicId === topic.id 
                      ? "border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/10 hover:border-indigo-600" 
                      : "border-slate-200 hover:border-indigo-500/20"
                  )}
                >
                  {editingTopic === topic.id ? (
                    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Topic Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-lg font-bold focus:ring-2 focus:ring-[#182442]/20 focus:border-[#182442] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Description</label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={4}
                          placeholder="Add a description for this topic..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#182442]/20 focus:border-[#182442] outline-none resize-none"
                        />
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => handleSaveTopic(topic.id)}
                          className="bg-[#182442] text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-all"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-white border border-slate-200 text-slate-600 px-6 py-2 rounded-lg font-bold hover:bg-slate-50 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <div className={cn("w-10 h-10 flex items-center justify-center rounded-lg group-hover:bg-indigo-50 transition-colors", getTopicColor(colorIndex).bg)}>
                          <span className={cn("material-symbols-outlined group-hover:text-indigo-600 transition-colors", getTopicColor(colorIndex).text)}>{getTopicIcon(colorIndex)}</span>
                        </div>
                        <h3 className="font-bold text-primary leading-tight font-manrope line-clamp-1 flex-1">{topic.name}</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTopic(topic);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-[#182442]"
                          title="Edit topic"
                        >
                          <span className="material-symbols-outlined !text-[18px]">edit</span>
                        </button>
                      </div>
                      {topic.description ? (
                        <p className="text-sm text-on-surface-variant mb-6 leading-relaxed line-clamp-2">
                          {topic.description}
                        </p>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTopic(topic);
                          }}
                          className="text-sm text-slate-400 italic hover:text-[#182442] transition-colors mb-6 text-left"
                        >
                          Add description...
                        </button>
                      )}
                      <div className="h-1 bg-slate-100 rounded-full w-full overflow-hidden">
                        <div className="h-full bg-[#3c6752]" style={{ width: `${Math.random() * 40 + 30}%` }}></div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {/* Placeholder for Add Topic */}
            <div 
              onClick={() => navigate('/new', { state: { createNewTopic: true } })}
              className="col-span-12 border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-400 hover:bg-indigo-50/20 transition-all cursor-pointer group"
            >
              <span className="material-symbols-outlined !text-4xl mb-2 group-hover:scale-110 transition-transform">add_circle</span>
              <p className="font-bold font-manrope">Initialize New Topic Cluster</p>
              <p className="text-xs mt-1">Categorize your learning for optimal recall</p>
            </div>
          </>
        )}
      </div>

      {/* Notes Quick View Section */}
      <div className="mt-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-4 h-[1px] bg-[#182442]/30"></span>
              <span className="text-[10px] font-bold text-[#182442]/50 uppercase tracking-widest">
                {selectedTopicId ? "Topic Collection" : "Knowledge Stream"}
              </span>
            </div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-4xl text-[#182442] font-medium leading-none">
              {selectedTopicId ? (
                <>Notes in <span className="italic">{topics.find(t => t.id === selectedTopicId)?.name}</span></>
              ) : (
                <>Recent <span className="italic">Notes</span></>
              )}
            </h3>
          </div>
          <button className="text-[#182442] font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
            Browse Full Library <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        
        {isLoading || isNotesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-6 h-24 animate-pulse"></div>
            ))}
          </div>
        ) : !recentNotes || recentNotes.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6 mx-auto">
              <span className="material-symbols-outlined text-slate-300 !text-5xl">note_add</span>
            </div>
            <h4 className="text-2xl font-bold text-[#182442] mb-3 font-manrope">No Notes Yet</h4>
            <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
              {selectedTopicId 
                ? "No notes have been added to this topic cluster yet."
                : "Start building your knowledge base by creating your first note. Notes can contain questions, concepts, or any information you want to remember."
              }
            </p>
            <button 
              onClick={() => navigate('/new', { state: { topicId: selectedTopicId } })}
              className="bg-[#182442] text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-[#182442]/10 inline-flex items-center gap-2"
            >
              <Plus size={20} />
              {selectedTopicId ? "Create Note in this Topic" : "Create First Note"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentNotes.map((note, index) => {
              const colorScheme = getTopicColor(index);
              return (
                <div key={note.id}
                  onClick={() => navigate('/new', { state: { editNoteId: note.id } })}
                  className="bg-white border border-slate-200 rounded-xl p-6 flex items-center gap-12 hover:border-indigo-500/20 transition-all group cursor-pointer shadow-sm">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center group-hover:bg-indigo-50 transition-colors shrink-0", colorScheme.bg)}>
                    <span className={cn("material-symbols-outlined group-hover:text-indigo-600 transition-colors", colorScheme.text)}>description</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-primary font-manrope truncate no-underline mb-1">
                      {stripHtml(note.title) || 'Untitled'}
                    </h4>
                    <p className="text-sm text-on-surface-variant truncate max-w-2xl no-underline">
                      {(() => {
                        const plain = stripHtml(note.content);
                        if (!plain) return 'No content yet';
                        return plain.length > 100 ? `${plain.substring(0, 100)}…` : plain;
                      })()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5">
                      Last updated
                    </p>
                    <p className="text-xs font-bold text-slate-600">{getNoteLastUpdatedDisplay(note)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-12 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/new', { state: { editNoteId: note.id } });
                      }}
                      className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Edit note"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleShareNote(note);
                      }}
                      className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Share note"
                    >
                      <span className="material-symbols-outlined">share</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB - Fixed Action Button */}
      <button 
        onClick={() => navigate('/new', { state: { topicId: selectedTopicId } })}
        className="fab-btn group"
      >
        <Plus size={32} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
};

export default Library;
