import React, { useState, useEffect } from 'react';
import { cn, stripHtml } from '../lib/utils';
import { EchoToast } from '../components/EchoToast';
import { Plus, X, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { api } from '../lib/api';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';

interface TopicDto {
  id: number;
  name: string;
  description: string | null;
}

interface TagResponseDto {
  id: number;
  name: string;
  noteCount: number;
}

interface MemoryItemDto {
  id: number;
  front: string;  // Changed from 'text'
  back: string;   // New field
  text?: string;  // Keep for backward compatibility
  source: string | null;
  nextReviewDate: string | null;
  reviewCount: number;
  due: boolean;
  tags: { id: number; name: string }[] | null;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
}

const NewNote: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, isAuthLoading } = useUser();
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());
  const [memoryItems, setMemoryItems] = useState<MemoryItemDto[]>([]);
  
  // Memory item front/back fields
  const [newMemoryItemFront, setNewMemoryItemFront] = useState('');
  const [newMemoryItemBack, setNewMemoryItemBack] = useState('');
  
  // Track original values for change detection
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // UI state
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showMemoryItemForm, setShowMemoryItemForm] = useState(false);
  const [newMemoryItemText, setNewMemoryItemText] = useState('');  // Keep for backward compatibility
  const [editingMemoryItemId, setEditingMemoryItemId] = useState<number | null>(null);
  const [showFormattingMenu, setShowFormattingMenu] = useState(false);
  
  // Data from backend
  const [topics, setTopics] = useState<TopicDto[]>([]);
  const [tags, setTags] = useState<TagResponseDto[]>([]);
  const [noteId, setNoteId] = useState<number | null>(null);
  
  // Inline tag/topic creation state
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize single unified TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading' && node.attrs.level === 1) {
            return 'New Title';
          }
          if (node.type.name === 'paragraph') {
            return 'Start writing your note...';
          }
          return '';
        },
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
        emptyNodeClass: 'is-empty',
      }),
    ],
    content: '<h1></h1><p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      // Keep inline markup in editor; strip only when saving / listing notes
      const extractedTitle = titleMatch ? titleMatch[1] : '';
      const extractedContent = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '').trim();
      
      setTitle(extractedTitle);
      setContent(extractedContent);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[500px] text-lg leading-relaxed',
      },
    },
  });

  // Update editor content when title or content state changes externally
  useEffect(() => {
    if (editor) {
      const currentHtml = editor.getHTML();
      const newHtml = `<h1>${title}</h1>${content}`;
      if (currentHtml !== newHtml) {
        editor.commands.setContent(newHtml);
      }
    }
  }, [title, content, editor]);

  // Track changes for save button
  useEffect(() => {
    // For title, compare both stripped text and raw HTML to detect formatting changes
    const currentTitleText = stripHtml(title).trim();
    const originalTitleText = stripHtml(originalTitle).trim();
    const titleTextChanged = currentTitleText !== originalTitleText;
    const titleFormattingChanged = title.trim() !== originalTitle.trim();
    
    const hasChanges =
      titleTextChanged || titleFormattingChanged || content !== originalContent;
    setHasUnsavedChanges(hasChanges);
  }, [title, content, originalTitle, originalContent]);

  // Load topics and tags on mount
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isAuthLoading) return;
      
      if (!accessToken) {
        navigate('/login');
        return;
      }

      try {
        console.log('Loading topics and tags...');
        const [topicsRes, tagsRes] = await Promise.all([
          api.get<PageResponse<TopicDto>>('/topics?page=0&size=100'),
          api.get<TagResponseDto[]>('/tags'),
        ]);

        console.log('Topics response:', topicsRes.data);
        console.log('Tags response:', tagsRes.data);

        if (isMounted) {
          const topicsData = topicsRes.data?.content || [];
          const tagsData = Array.isArray(tagsRes.data) ? tagsRes.data : [];
          
          setTopics(topicsData);
          setTags(tagsData);
          
          console.log('Topics loaded:', topicsData.length);
          console.log('Tags loaded:', tagsData.length);
        }

        // If navigated here for editing, load the existing note
        const editId = (location.state as { editNoteId?: number } | null)?.editNoteId;
        if (editId && isMounted) {
          console.log('Loading note for editing, ID:', editId);
          
          // Define proper response type matching backend NoteDto
          interface NoteResponse {
            id: number;
            title: string;
            content: string;
            topic: TopicDto | null;
            tags: TagResponseDto[] | null;
            memoryItems?: MemoryItemDto[] | null;
          }
          
          const noteRes = await api.get<NoteResponse>(`/notes/${editId}`);
          console.log('Note loaded:', noteRes.data);
          
          if (isMounted) {
            const note = noteRes.data;
            
            // Set basic note data
            setNoteId(note.id);
            setTitle(note.title);
            setContent(note.content);
            setOriginalTitle(stripHtml(note.title));
            setOriginalContent(note.content);
            
            // Set topic from the note's topic object
            if (note.topic && note.topic.id) {
              console.log('Setting topic from note:', note.topic);
              setSelectedTopicId(note.topic.id);
            }
            
            // Set tags from the note's tags array
            if (note.tags && Array.isArray(note.tags)) {
              const tagIds = note.tags.map(tag => tag.id);
              console.log('Setting tags from note:', tagIds);
              setSelectedTagIds(new Set(tagIds));
            }
            
            // Set memory items if they exist in the response
            if (note.memoryItems && Array.isArray(note.memoryItems)) {
              console.log('Memory items from note:', note.memoryItems.length);
              setMemoryItems(note.memoryItems);
            } else {
              // Fallback: Fetch all memory items and filter by source matching the note title
              console.log('Fetching memory items separately...');
              try {
                const memoryRes = await api.get<PageResponse<MemoryItemDto>>('/memories?page=0&size=100');
                console.log('Raw memory response:', memoryRes.data);
                if (isMounted && memoryRes.data?.content) {
                  // Log each memory item structure
                  memoryRes.data.content.forEach((item, idx) => {
                    console.log(`Memory Item ${idx}:`, {
                      id: item.id,
                      front: item.front,
                      back: item.back,
                      text: item.text,
                      source: item.source,
                      hasKeys: Object.keys(item)
                    });
                  });
                  
                  // Filter memory items that have source matching this note's title
                  const noteMemoryItems = memoryRes.data.content.filter(
                    item => item.source === note.title
                  );
                  setMemoryItems(noteMemoryItems);
                  console.log(`Filtered ${noteMemoryItems.length} memory items for note "${note.title}"`);
                }
              } catch (memErr) {
                console.error('Failed to load memory items:', memErr);
                // Don't fail the whole load if memory items fail
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        if (isMounted) {
          setError('Failed to load topics and tags');
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthLoading, navigate]);

  const handleSaveNote = async () => {
    // Validate title
    const trimmedTitle = stripHtml(title).trim();
    if (!trimmedTitle || trimmedTitle.length < 2) {
      setError('Title must be at least 2 characters');
      return;
    }
    if (trimmedTitle.length > 200) {
      setError('Title must be less than 200 characters');
      return;
    }
    
    // Strip HTML tags before checking content so '<p></p>' counts as empty
    const trimmedContent = content.trim();
    const strippedContent = stripHtml(trimmedContent);
    if (!strippedContent || strippedContent.length < 2) {
      setError('Content must be at least 2 characters');
      return;
    }
    if (trimmedContent.length > 5000) {
      setError('Content must be less than 5000 characters');
      return;
    }
    
    if (!noteId && !selectedTopicId) {
      // Topic is only required when creating a new note
      setError('Please select a topic');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (noteId) {
        // UPDATE — NoteUpdateRequest only accepts title, content and tagIds (no topicId)
        const updatePayload = {
          title: trimmedTitle,
          content: trimmedContent,
          tagIds: Array.from(selectedTagIds),
        };
        console.log('Updating note with payload:', updatePayload);
        await api.put(`/notes/${noteId}`, updatePayload);
        setOriginalTitle(trimmedTitle);
        setOriginalContent(trimmedContent);
        setSuccess('Note updated successfully!');
      } else {
        // CREATE — NoteRequest requires topicId
        const createPayload = {
          title: trimmedTitle,
          content: trimmedContent,
          topicId: selectedTopicId,
          tagIds: Array.from(selectedTagIds),
        };
        console.log('Creating note with payload:', createPayload);
        const response = await api.post<{ id: number }>('/notes', createPayload);
        console.log('Note created successfully:', response.data);
        setNoteId(response.data.id);
        setOriginalTitle(trimmedTitle);
        setOriginalContent(trimmedContent);
        setSuccess('Note saved! Add memory items below or go to the Library.');
      }

      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error('Failed to save note:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to save note';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!noteId) return;
    
    if (!confirm('Are you sure you want to delete this note?')) return;

    setIsDeleting(true);
    setError(null);

    try {
      await api.delete(`/notes/${noteId}`);
      setSuccess('Note deleted successfully!');
      setTimeout(() => navigate('/library'), 1500);
    } catch (err: any) {
      console.error('Failed to delete note:', err);
      setError(err.response?.data?.message || 'Failed to delete note');
      setIsDeleting(false);
    }
  };

  const handleAddMemoryItem = async () => {
    const trimmedFront = newMemoryItemFront.trim();
    const trimmedBack = newMemoryItemBack.trim();
    
    if (!trimmedFront) {
      setError('Front side is required');
      return;
    }
    
    if (!trimmedBack) {
      setError('Back side is required');
      return;
    }

    if (!noteId) {
      setError('Please save the note first before adding memory items');
      return;
    }

    setError(null);

    try {
      const memoryData = {
        front: trimmedFront,
        back: trimmedBack,
        source: title.trim() || 'Untitled Note',
        noteId: noteId,
        tagIds: Array.from(selectedTagIds),
      };

      console.log('Creating memory item with payload:', memoryData);
      const response = await api.post<MemoryItemDto>('/memories', memoryData);
      console.log('Memory item created - Full response:', response);
      console.log('Memory item created - Data:', response.data);
      console.log('Memory item created - Data type:', typeof response.data);
      console.log('Memory item created - Data keys:', Object.keys(response.data || {}));
      console.log('Memory item created - Front:', response.data?.front);
      console.log('Memory item created - Back:', response.data?.back);
      
      setMemoryItems([...memoryItems, response.data]);
      setNewMemoryItemFront('');
      setNewMemoryItemBack('');
      setShowMemoryItemForm(false);
      setSuccess('Memory item added!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error('Failed to add memory item:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to add memory item';
      setError(errorMessage);
    }
  };

  const handleDeleteMemoryItem = async (id: number) => {
    if (!confirm('Delete this memory item?')) return;

    try {
      await api.delete(`/memories/${id}`);
      setMemoryItems(memoryItems.filter(item => item.id !== id));
      setSuccess('Memory item deleted!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error('Failed to delete memory item:', err);
      setError(err.response?.data?.message || 'Failed to delete memory item');
    }
  };

  const toggleTag = (tagId: number) => {
    const newSelectedTags = new Set(selectedTagIds);
    if (newSelectedTags.has(tagId)) {
      newSelectedTags.delete(tagId);
    } else {
      newSelectedTags.add(tagId);
    }
    setSelectedTagIds(newSelectedTags);
  };

  const handleCreateTag = async () => {
    const trimmedName = newTagName.trim();
    if (!trimmedName) {
      setError('Tag name is required');
      return;
    }
    
    setIsCreatingTag(true);
    setError(null);
    
    try {
      const payload = { name: trimmedName };
      console.log('Creating tag with payload:', payload);
      
      const response = await api.post<TagResponseDto>('/tags', payload);
      console.log('Tag created successfully:', response.data);
      const created = response.data;
      
      // Update tags list
      setTags(prev => {
        const updated = [...(prev || []), created];
        console.log('Tags updated:', updated);
        return updated;
      });
      
      // Add to selected tags
      setSelectedTagIds(prev => {
        const newSet = new Set(prev);
        newSet.add(created.id);
        console.log('Selected tag IDs:', Array.from(newSet));
        return newSet;
      });
      
      setNewTagName('');
      setSuccess(`Tag "${created.name}" created!`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error('Tag creation error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to create tag';
      setError(errorMessage);
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleCreateTopic = async () => {
    const trimmedName = newTopicName.trim();
    if (!trimmedName) {
      setError('Topic name is required');
      return;
    }
    
    setIsCreatingTopic(true);
    setError(null);
    
    try {
      const payload: { name: string; description?: string } = {
        name: trimmedName,
      };
      
      const trimmedDesc = newTopicDesc.trim();
      if (trimmedDesc) {
        payload.description = trimmedDesc;
      }
      
      console.log('Creating topic with payload:', payload);
      const response = await api.post<TopicDto>('/topics', payload);
      console.log('Topic created successfully:', response.data);
      const created = response.data;
      
      // Update topics list
      setTopics(prev => {
        const updated = [...(prev || []), created];
        console.log('Topics updated:', updated);
        return updated;
      });
      
      setSelectedTopicId(created.id);
      setNewTopicName('');
      setNewTopicDesc('');
      setShowNewTopicForm(false);
      setShowTopicDropdown(false);
      setSuccess(`Topic "${created.name}" created!`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error('Topic creation error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to create topic';
      setError(errorMessage);
    } finally {
      setIsCreatingTopic(false);
    }
  };

  const getSelectedTopic = () => {
    if (!topics || topics.length === 0) {
      console.log('[getSelectedTopic] No topics available');
      return null;
    }
    const selected = topics.find(t => t.id === selectedTopicId);
    console.log('[getSelectedTopic] Selected topic:', selected, 'from ID:', selectedTopicId);
    return selected;
  };

  const getSelectedTags = () => {
    if (!tags || tags.length === 0) {
      console.log('[getSelectedTags] No tags available');
      return [];
    }
    const selected = tags.filter(t => selectedTagIds.has(t.id));
    console.log('[getSelectedTags] Selected tags:', selected, 'from IDs:', Array.from(selectedTagIds));
    return selected;
  };

  if (isLoadingData) {
    return (
      <div className="max-w-[1200px] mx-auto p-gutter flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-gutter space-y-gutter animate-in fade-in duration-700 pb-24">
      {(error || success) && (
        <div className="space-y-2">
          {error && (
            <EchoToast message={error} variant="error" onDismiss={() => setError(null)} />
          )}
          {success && (
            <EchoToast
              message={success}
              variant="success"
              onDismiss={() => setSuccess(null)}
              action={{ label: 'Library', onClick: () => navigate('/library') }}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Column: Editor Shell */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-3">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/library')}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all active:scale-95 shrink-0"
                title="Back to Library"
              >
                <span className="material-symbols-outlined !text-[20px]">arrow_back</span>
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1 shrink-0"></div>
              <button 
                onClick={() => editor?.chain().focus().undo().run()}
                disabled={!editor}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all active:scale-95 shrink-0 hidden md:flex"
                title="Undo"
              >
                <span className="material-symbols-outlined !text-[20px]">undo</span>
              </button>
              <button 
                onClick={() => editor?.chain().focus().redo().run()}
                disabled={!editor}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all active:scale-95 shrink-0 hidden md:flex"
                title="Redo"
              >
                <span className="material-symbols-outlined !text-[20px]">redo</span>
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1 shrink-0 hidden md:block"></div>
              
              {/* Desktop formatting buttons */}
              <button 
                onClick={() => editor?.chain().focus().toggleBold().run()}
                disabled={!editor}
                className={cn(
                  "p-2 rounded-lg font-bold min-w-[36px] h-9 flex items-center justify-center text-sm transition-all shrink-0 hidden md:flex",
                  editor?.isActive('bold') 
                    ? "text-indigo-600 bg-indigo-50" 
                    : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                )}
                title="Bold"
              >
                B
              </button>
              <button 
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                disabled={!editor}
                className={cn(
                  "p-2 rounded-lg italic min-w-[36px] h-9 flex items-center justify-center text-sm transition-all shrink-0 hidden md:flex",
                  editor?.isActive('italic') 
                    ? "text-indigo-600 bg-indigo-50" 
                    : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                )}
                title="Italic"
              >
                I
              </button>
              <button 
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                disabled={!editor}
                className={cn(
                  "p-2 rounded-lg min-w-[36px] h-9 flex items-center justify-center text-sm transition-all shrink-0 hidden md:flex",
                  editor?.isActive('underline') 
                    ? "text-indigo-600 bg-indigo-50" 
                    : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                )}
                title="Underline"
              >
                <span className="underline">U</span>
              </button>

              {/* Mobile formatting dropdown button */}
              <button 
                onClick={() => setShowFormattingMenu(!showFormattingMenu)}
                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg min-w-[36px] h-9 flex items-center justify-center text-sm transition-all shrink-0 md:hidden"
                title="Formatting options"
              >
                <span className="material-symbols-outlined !text-[20px]">more_horiz</span>
              </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button 
                onClick={handleDeleteNote}
                disabled={isDeleting || !noteId}
                className="px-6 py-2 bg-[#ffdad6] text-[#93000a] font-bold text-sm rounded-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Delete'
                )}
              </button>
              <button 
                onClick={handleSaveNote}
                disabled={isSaving || (!hasUnsavedChanges && noteId !== null)}
                className="px-6 py-2 bg-[#182442] text-white font-bold text-sm rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Save Note'
                )}
              </button>
            </div>
          </div>

          {/* Mobile formatting dropdown menu - positioned outside action bar */}
          {showFormattingMenu && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 bg-black/20 z-40 md:hidden" 
                onClick={() => setShowFormattingMenu(false)}
              />
              {/* Dropdown menu - horizontal layout */}
              <div className="fixed top-36 left-1/2 -translate-x-1/2 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 p-2 flex flex-row gap-2 md:hidden">
                <button 
                  onClick={() => {
                    editor?.chain().focus().toggleBold().run();
                    setShowFormattingMenu(false);
                  }}
                  disabled={!editor}
                  className={cn(
                    "px-4 py-2 rounded-lg font-bold text-lg transition-all min-w-[48px] h-10 flex items-center justify-center",
                    editor?.isActive('bold') 
                      ? "text-white bg-indigo-600" 
                      : "text-slate-700 bg-slate-50 hover:bg-indigo-50"
                  )}
                  title="Bold"
                >
                  B
                </button>
                <button 
                  onClick={() => {
                    editor?.chain().focus().toggleItalic().run();
                    setShowFormattingMenu(false);
                  }}
                  disabled={!editor}
                  className={cn(
                    "px-4 py-2 rounded-lg italic text-lg transition-all min-w-[48px] h-10 flex items-center justify-center",
                    editor?.isActive('italic') 
                      ? "text-white bg-indigo-600" 
                      : "text-slate-700 bg-slate-50 hover:bg-indigo-50"
                  )}
                  title="Italic"
                >
                  I
                </button>
                <button 
                  onClick={() => {
                    editor?.chain().focus().toggleUnderline().run();
                    setShowFormattingMenu(false);
                  }}
                  disabled={!editor}
                  className={cn(
                    "px-4 py-2 rounded-lg text-lg transition-all min-w-[48px] h-10 flex items-center justify-center",
                    editor?.isActive('underline') 
                      ? "text-white bg-indigo-600" 
                      : "text-slate-700 bg-slate-50 hover:bg-indigo-50"
                  )}
                  title="Underline"
                >
                  <span className="underline">U</span>
                </button>
              </div>
            </>
          )}

          {/* Rich Text Canvas */}
          <div className="bg-white rounded-xl border border-slate-200 p-12 min-h-[600px] shadow-sm">
            {/* Current Topic and Tags Display */}
            {(selectedTopicId || selectedTagIds.size > 0) && (
              <div className="mb-6 pb-6 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Topic Badge */}
                  {selectedTopicId && getSelectedTopic() && (
                    <div className="flex items-center gap-2 bg-[#182442]/5 border border-[#182442]/10 px-4 py-2 rounded-xl">
                      <span className="material-symbols-outlined !text-[16px] text-[#182442]">folder</span>
                      <span className="text-sm font-bold text-[#182442]">{getSelectedTopic()?.name}</span>
                    </div>
                  )}
                  
                  {/* Tags Badges */}
                  {getSelectedTags().map((tag) => (
                    <div 
                      key={tag.id}
                      className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl"
                    >
                      <span className="material-symbols-outlined !text-[16px] text-indigo-600">sell</span>
                      <span className="text-sm font-bold text-indigo-600">{tag.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Right Column: Sidebar (Topic, Tags & Memory Items) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Topic Selection */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#182442] flex items-center gap-2 text-sm font-manrope uppercase tracking-widest">
                <span className="material-symbols-outlined !text-[18px]">folder</span>
                Topic
              </h3>
              {!selectedTopicId && (
                <span className="text-xs text-red-500 font-medium">Required</span>
              )}
            </div>
            {/* Locked in edit mode — NoteUpdateRequest has no topicId field */}
            {noteId && (
              <p className="text-[10px] text-slate-400 font-medium mb-2">
                Topic cannot be changed after creation.
              </p>
            )}
            <div className="relative">
              <button
                onClick={() => !noteId && setShowTopicDropdown(!showTopicDropdown)}
                disabled={!!noteId}
                className={cn(
                  "w-full px-4 py-3 border rounded-lg text-left flex items-center justify-between transition-all",
                  noteId
                    ? "bg-slate-50 border-slate-100 cursor-not-allowed opacity-70"
                    : "bg-slate-50 border-slate-200 hover:border-indigo-300"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  selectedTopicId ? "text-slate-700" : "text-slate-400"
                )}>
                  {getSelectedTopic()?.name || 'Select a topic...'}
                </span>
                <span className="material-symbols-outlined text-slate-400 !text-[20px]">
                  {noteId ? 'lock' : (showTopicDropdown ? 'expand_less' : 'expand_more')}
                </span>
              </button>
              
              {showTopicDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  {/* Existing topics list */}
                  <div className="max-h-48 overflow-y-auto">
                    {!topics || topics.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No topics yet — create one below
                      </div>
                    ) : (
                      topics.map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => {
                            setSelectedTopicId(topic.id);
                            setShowTopicDropdown(false);
                            setShowNewTopicForm(false);
                          }}
                          className={cn(
                            "w-full px-4 py-3 text-left hover:bg-indigo-50 transition-all text-sm",
                            selectedTopicId === topic.id ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-700"
                          )}
                        >
                          <div className="font-medium">{topic.name}</div>
                          {topic.description && (
                            <div className="text-xs text-slate-500 mt-1 line-clamp-1">{topic.description}</div>
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Toggle: create new topic */}
                  <div className="border-t border-slate-100">
                    {!showNewTopicForm ? (
                      <button
                        onClick={() => setShowNewTopicForm(true)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all"
                      >
                        <Plus size={12} />
                        Create new topic
                      </button>
                    ) : (
                      <div className="p-3 bg-slate-50/50 space-y-2">
                        <input
                          type="text"
                          autoFocus
                          className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-2 focus:ring-1 focus:ring-[#182442]/20 focus:border-[#182442] outline-none bg-white placeholder:text-slate-300"
                          placeholder="Topic name (required)"
                          value={newTopicName}
                          onChange={e => setNewTopicName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') void handleCreateTopic(); }}
                        />
                        <input
                          type="text"
                          className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-2 focus:ring-1 focus:ring-[#182442]/20 focus:border-[#182442] outline-none bg-white placeholder:text-slate-300"
                          placeholder="Description (optional)"
                          value={newTopicDesc}
                          onChange={e => setNewTopicDesc(e.target.value)}
                        />
                        <div className="flex gap-1.5 pt-1">
                          <button
                            onClick={() => void handleCreateTopic()}
                            disabled={isCreatingTopic || !newTopicName.trim()}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#182442] text-white text-xs font-bold rounded-md hover:opacity-90 disabled:opacity-40 transition-all"
                          >
                            {isCreatingTopic
                              ? <Loader2 size={11} className="animate-spin" />
                              : <Plus size={11} />
                            }
                            Create Topic
                          </button>
                          <button
                            onClick={() => { setShowNewTopicForm(false); setNewTopicName(''); setNewTopicDesc(''); }}
                            className="px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-md transition-all font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Tag Management */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#182442] flex items-center gap-2 text-sm font-manrope uppercase tracking-widest">
                <span className="material-symbols-outlined !text-[18px]">sell</span>
                Tags
              </h3>
              <button 
                onClick={() => setShowTagDropdown(!showTagDropdown)}
                className="text-indigo-600 text-xs font-bold hover:underline"
              >
                {showTagDropdown ? 'Close' : 'Add Tags'}
              </button>
            </div>
            
            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2">
              {getSelectedTags().length === 0 ? (
                <>
                  <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold border border-slate-100 flex items-center gap-1 italic uppercase tracking-widest">
                    No tags yet
                  </span>
                </>
              ) : (
                getSelectedTags().map((tag) => (
                  <span 
                    key={tag.id}
                    className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold border border-indigo-100 flex items-center gap-1 uppercase tracking-widest"
                  >
                    {tag.name}
                    <button 
                      onClick={() => toggleTag(tag.id)}
                      className="material-symbols-outlined !text-[14px] hover:text-indigo-800"
                    >
                      close
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Tag Dropdown */}
            {showTagDropdown && (
              <div className="border border-slate-200 rounded-lg mt-3 overflow-hidden">
                {/* Existing tags list */}
                <div className="max-h-36 overflow-y-auto p-2 space-y-1">
                  {tags.length === 0 ? (
                    <div className="p-2 text-center text-xs text-slate-500">
                      No tags yet — create one below
                    </div>
                  ) : (
                    tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          "w-full px-3 py-2 text-left rounded-md text-xs hover:bg-slate-50 transition-all flex items-center justify-between",
                          selectedTagIds.has(tag.id) ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-700"
                        )}
                      >
                        <span>{tag.name}</span>
                        {selectedTagIds.has(tag.id) && (
                          <span className="material-symbols-outlined !text-[16px]">check</span>
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Inline create-tag form */}
                <div className="border-t border-slate-100 bg-slate-50/50 p-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      className="flex-1 text-xs border border-slate-200 rounded-md px-2.5 py-2 focus:ring-1 focus:ring-[#182442]/20 focus:border-[#182442] outline-none bg-white placeholder:text-slate-300"
                      placeholder="New tag name…"
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') void handleCreateTag(); }}
                    />
                    <button
                      onClick={() => void handleCreateTag()}
                      disabled={isCreatingTag || !newTagName.trim()}
                      className="flex items-center gap-1 px-3 py-2 bg-[#182442] text-white text-xs font-bold rounded-md hover:opacity-90 disabled:opacity-40 transition-all shrink-0"
                    >
                      {isCreatingTag
                        ? <Loader2 size={11} className="animate-spin" />
                        : <Plus size={11} />
                      }
                      Create
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Memory Items (Flashcards) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-[#182442] flex items-center gap-2 text-sm font-manrope uppercase tracking-widest">
                <span className="material-symbols-outlined !text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                Memory Items
              </h3>
              <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                {memoryItems.length} Active
              </span>
            </div>

            {/* Add Memory Item Trigger */}
            {!showMemoryItemForm ? (
              <button 
                onClick={() => {
                  if (!noteId) {
                    setError('Please save the note first before adding memory items');
                    return;
                  }
                  setShowMemoryItemForm(true);
                }}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all group flex items-center justify-center gap-2 font-medium active:scale-95"
              >
                <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
                Extract Flashcard
              </button>
            ) : (
              <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    Front (Prompt/Question)
                  </label>
                  <textarea
                    className="w-full text-sm border border-slate-200/60 rounded-xl p-3 bg-white focus:bg-white focus:ring-4 focus:ring-[#182442]/5 focus:border-[#182442] outline-none resize-none transition-all"
                    placeholder="What you'll see during review..."
                    rows={2}
                    value={newMemoryItemFront}
                    onChange={(e) => setNewMemoryItemFront(e.target.value)}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    Back (Answer/Details)
                  </label>
                  <textarea
                    className="w-full text-sm border border-slate-200/60 rounded-xl p-3 bg-white focus:bg-white focus:ring-4 focus:ring-[#182442]/5 focus:border-[#182442] outline-none resize-none transition-all"
                    placeholder="What you'll reveal after showing front..."
                    rows={3}
                    value={newMemoryItemBack}
                    onChange={(e) => setNewMemoryItemBack(e.target.value)}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleAddMemoryItem}
                    className="flex-1 px-4 py-2 bg-[#182442] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowMemoryItemForm(false);
                      setNewMemoryItemFront('');
                      setNewMemoryItemBack('');
                    }}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Memory Item Cards */}
            <div className="flex flex-col gap-3">
              {memoryItems.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white border border-slate-200 p-6 rounded-xl hover:border-indigo-600/20 transition-all group shadow-sm"
                >
                  {editingMemoryItemId === item.id ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">EDITING MEMORY CARD</span>
                        <button 
                          onClick={() => {
                            setEditingMemoryItemId(null);
                            setNewMemoryItemFront('');
                            setNewMemoryItemBack('');
                          }}
                          className="material-symbols-outlined text-slate-400 hover:text-slate-600 !text-[18px]"
                        >
                          close
                        </button>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                          Front
                        </label>
                        <textarea
                          className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                          rows={2}
                          value={newMemoryItemFront || item.front || item.text || ''}
                          onChange={(e) => setNewMemoryItemFront(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                          Back
                        </label>
                        <textarea
                          className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                          rows={3}
                          value={newMemoryItemBack || item.back || ''}
                          onChange={(e) => setNewMemoryItemBack(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          onClick={() => {
                            setEditingMemoryItemId(null);
                            setNewMemoryItemFront('');
                            setNewMemoryItemBack('');
                          }}
                          className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await api.put(`/memories/${item.id}`, {
                                front: newMemoryItemFront || item.front || item.text,
                                back: newMemoryItemBack || item.back
                              });
                              // Refresh the memory items list
                              const memoryRes = await api.get<PageResponse<MemoryItemDto>>('/memories?page=0&size=100');
                              if (memoryRes.data?.content) {
                                const noteMemoryItems = memoryRes.data.content.filter(
                                  mi => mi.source === title.trim()
                                );
                                setMemoryItems(noteMemoryItems);
                              }
                              setEditingMemoryItemId(null);
                              setNewMemoryItemFront('');
                              setNewMemoryItemBack('');
                              setSuccess('Memory item updated!');
                              setTimeout(() => setSuccess(null), 2000);
                            } catch (err: any) {
                              console.error('Failed to update memory item:', err);
                              setError(err.response?.data?.message || 'Failed to update memory item');
                            }
                          }}
                          className="px-4 py-2 text-sm bg-[#182442] text-white font-bold rounded-lg hover:opacity-90 transition-all"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MEMORY CARD</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingMemoryItemId(item.id);
                              setNewMemoryItemFront(item.front || item.text || '');
                              setNewMemoryItemBack(item.back || '');
                            }}
                            className="material-symbols-outlined text-slate-300 hover:text-indigo-500 !text-[18px]"
                            title="Edit"
                          >
                            edit
                          </button>
                          <button 
                            onClick={() => handleDeleteMemoryItem(item.id)}
                            className="material-symbols-outlined text-slate-300 hover:text-red-500 !text-[18px]"
                            title="Delete"
                          >
                            delete
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Front</span>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {item.front || item.text || 'No content'}
                          </p>
                        </div>
                        {item.back && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Back</span>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {item.back}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-4">
                        <span className="flex items-center gap-1 text-[10px] text-[#3c6752] font-bold uppercase tracking-widest">
                          <span className="material-symbols-outlined !text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          {item.reviewCount > 0 ? `${item.reviewCount}x` : 'NEW'}
                        </span>
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                          {item.due ? 'Due now' : 'Scheduled'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Knowledge Graph Thumbnail */}
          <section className="bg-[#182442] rounded-xl overflow-hidden shadow-xl relative group cursor-crosshair">
            <div className="absolute inset-0 bg-gradient-to-t from-[#182442]/80 to-transparent z-10"></div>
            <img 
              alt="Knowledge graph visualization" 
              className="w-full h-48 object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIkPrNLpqecnKdB-gfXRc4DRQXph6Q34vOTP9xIwPvZWNfL-jf6-JiUDTLHzVRpEOovFRbN_AqK1k-PEZcQQoflsw_EXPlN1ykfLSjriUkAkTyogJkwSUjOYGsRK6KfQId7otJcgj3ZV6XH_2FWxazThWNats1KQ8xQ4HDXd5DTsaKDnB3OKMHF2tzP33f2TF6Y_Ce8tBJfgYCLVIvn1Z1a5FohJXD2Fy1r3P5w_KGtVYQs5h8SL3PuKrdWgBNE4Shv6mB1OOa6Wg" 
            />
            <div className="absolute bottom-4 left-4 z-20">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1 block">Contextual Mapping</span>
              <h4 className="text-white font-bold text-sm font-manrope">Visualize Connections</h4>
            </div>
            <button className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all">
              <span className="material-symbols-outlined !text-[16px]">open_in_full</span>
            </button>
          </section>
        </div>
      </div>

      {/* Contextual FAB */}
      <div className="fixed bottom-8 right-8 z-[60]">
        <button className="bg-[#182442] text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative">
          <span className="material-symbols-outlined !text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <div className="absolute right-full mr-4 bg-[#182442] text-white px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-white/10">
            AI Extract Insights
          </div>
        </button>
      </div>
    </div>
  );
};

export default NewNote;
