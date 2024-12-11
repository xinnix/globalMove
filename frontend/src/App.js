import React, { useState, useEffect, useRef } from 'react';
import './styles/globals.css';
import { Button } from './components/ui/button';
import { Spinner } from './components/ui/spinner';
import { Translate } from '@mui/icons-material';
import WaveformDisplay from './components/WaveformDisplay';
import { useTranslation } from 'react-i18next';
import { useAuth } from './contexts/AuthContext';
import { notes, practices, activities } from './services/api';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import HighlightedText from './components/HighlightedText';
import ActivityHeatmap from './components/ActivityHeatmap';
import SpeakingScore from './components/SpeakingScore';
import Header from './components/Header';
import { Box } from '@mui/material';

function App() {
  const { t } = useTranslation();
  const { user, login, register, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [audioElement, setAudioElement] = useState(null);
  const [currentWord, setCurrentWord] = useState(-1);
  const [duration, setDuration] = useState(0);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ notes: 0, tags: 0, days: 0 });
  const [currentPractice, setCurrentPractice] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const steps = [
    t('menu.takeNotes'),
    t('menu.translate'),
    t('menu.practice'),
    t('menu.review')
  ];

  const handleMenu = (event) => {
    // Removed unused function
  };

  const handleCloseMenu = () => {
    // Removed unused function
  };

  const handleLogout = () => {
    // Removed unused function
  };

  const handleLoginSuccess = async (credentials) => {
    try {
      await login(credentials);
      loadNotes();
      fetchActivities();
    } catch (error) {
      throw error;
    }
  };

  const handleRegisterSuccess = async (userData) => {
    try {
      await register(userData);
      loadNotes();
      fetchActivities();
    } catch (error) {
      throw error;
    }
  };

  const loadNotes = async () => {
    try {
      const response = await notes.list();
      setNotes(response.data);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data } = await activities.list();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  useEffect(() => {
    if (user) {
      // 获取用户活动数据
      activities.list()
        .then(response => {
          setActivities(response.data.activities);
          setStats(response.data.stats);
        })
        .catch(error => {
          console.error('Error fetching activities:', error);
        });
    }
  }, [user]);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      fetchActivities();
    }
  }, []);

  const handleNoteSubmit = async () => {
    if (!currentNote.trim()) return;

    try {
      const { data } = await notes.create({ text: currentNote });
      setNotes([data, ...notes]);
      setCurrentNote('');
      setActiveStep(1);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  // 处理笔记翻译
  const handleTranslate = async (note) => {
    if (!note || !note.text) return;

    try {
      const response = await notes.update(note.id, {
        action: 'translate',
        text: note.text
      });
      
      // 更新笔记列表中的翻译
      setNotes(prevNotes => 
        prevNotes.map(n => 
          n.id === note.id ? { ...n, translated_text: response.data.translated_text } : n
        )
      );

      // 如果是当前笔记，也更新当前笔记的翻译
      if (currentNote && currentNote.id === note.id) {
        setCurrentNote(prev => ({ ...prev, translated_text: response.data.translated_text }));
      }
    } catch (error) {
      console.error('Translation error:', error);
    }
  };

  // 生成音频
  const generateAudio = async (note) => {
    if (!note || !note.text) return;

    try {
      const response = await notes.update(note.id, {
        action: 'generate_audio',
        text: note.text
      });
      
      // 更新笔记列表中的音频 URL
      setNotes(prevNotes => 
        prevNotes.map(n => 
          n.id === note.id ? { ...n, audio_url: response.data.audio_url } : n
        )
      );

      // 如果是当前笔记，也更新当前笔记的音频 URL
      if (currentNote && currentNote.id === note.id) {
        setCurrentNote(prev => ({ ...prev, audio_url: response.data.audio_url }));
      }
    } catch (error) {
      console.error('Audio generation error:', error);
    }
  };

  // 更新笔记进度
  const updateNoteProgress = async (noteId, progress) => {
    try {
      const response = await notes.update(noteId, {
        action: 'update_progress',
        progress: progress
      });
      
      // 更新笔记列表中的进度
      setNotes(prevNotes => 
        prevNotes.map(n => 
          n.id === noteId ? { ...n, progress: response.data.progress } : n
        )
      );

      // 如果是当前笔记，也更新当前笔记的进度
      if (currentNote && currentNote.id === noteId) {
        setCurrentNote(prev => ({ ...prev, progress: response.data.progress }));
      }
    } catch (error) {
      console.error('Progress update error:', error);
    }
  };

  const playAudio = async (audioUrl, text) => {
    try {
      // 如果已经有音频在播放，先停止它
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }

      const audio = new Audio(audioUrl);
      setAudioElement(audio);

      // 设置音频事件监听器
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
        
        // 计算当前应该高亮的单词
        if (text) {
          const words = text.split(' ');
          const wordDuration = audio.duration / words.length;
          const currentWordIndex = Math.floor(audio.currentTime / wordDuration);
          setCurrentWord(currentWordIndex < words.length ? currentWordIndex : -1);
        }
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentWord(-1);
        setCurrentTime(0);
      });

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Failed to play audio. Please try again.');
      setIsPlaying(false);
    }
  };

  const handleAudioPlay = async (url, text) => {
    if (isPlaying) {
      audioElement?.pause();
      setIsPlaying(false);
      setCurrentWord(-1);
      setCurrentTime(0);
    } else {
      await playAudio(url, text);
    }
  };

  const handleAudioStop = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlaying(false);
      setCurrentWord(-1);
      setCurrentTime(0);
    }
  };

  // 添加组件卸载时的清理函数
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, [audioElement]);

  // 自动翻译和生成语音
  useEffect(() => {
    if (notes.length > 0) {
      notes.forEach(async (note) => {
        if (!note.translated_text) {
          await handleTranslate(note);
        }
        if (note.translated_text && !note.audio_url) {
          await generateAudio(note);
        }
      });
    }
  }, [notes, handleTranslate, generateAudio]);

  // 录音相关状态和引用
  const initRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        audioChunksRef.current = [];
        
        // 创建 FormData 对象
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');
        formData.append('noteId', currentNote.id);

        try {
          const response = await practices.create(formData);
          setCurrentPractice(response.data);
          // 更新活动数据
          fetchActivities();
        } catch (error) {
          console.error('Error saving practice:', error);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error('Error initializing recording:', error);
    }
  };

  const startRecording = async () => {
    if (!mediaRecorderRef.current) {
      await initRecording();
    }
    
    if (mediaRecorderRef.current && !isRecording) {
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <Header />
      
      {!user ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: 'calc(100vh - 64px)' // 减去顶部栏的高度
        }}>
          <div className="container mx-auto py-6">
            <div className="max-w-md mx-auto rounded-lg border bg-card p-6">
              <h2 className="text-2xl font-semibold mb-4 text-card-foreground">
                {t('auth.title')}
              </h2>
              {showLogin ? (
                <LoginForm
                  onLogin={handleLoginSuccess}
                  onSwitchToRegister={() => setShowLogin(false)}
                />
              ) : (
                <RegisterForm
                  onRegister={handleRegisterSuccess}
                  onSwitchToLogin={() => setShowLogin(true)}
                />
              )}
            </div>
          </div>
        </Box>
      ) : (
        <Box sx={{ p: 4 }}>
          {/* 热力图统计区域 */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-2xl font-semibold mb-4 text-card-foreground">
              {t('stats.practiceStats')}
            </h2>
            {user && (
              <ActivityHeatmap 
                activities={activities}
                stats={stats}
              />
            )}
          </div>

          {/* 主要内容区域 */}
          <div className="rounded-lg border bg-card p-6">
            {/* 进度指示器 */}
            <div className="mb-8">
              {steps.map((label, index) => (
                <div key={label} className={`flex items-center ${index === activeStep ? 'text-primary' : 'text-card-foreground'}`}>
                  <div className={`w-4 h-4 mr-2 ${index === activeStep ? 'bg-primary' : 'bg-card-foreground'}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* 笔记输入区域 */}
            <div className="space-y-4 mb-8">
              <textarea
                className="bg-background w-full p-4"
                rows={4}
                placeholder={t('notes.inputPlaceholder')}
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
              />
              <Button
                onClick={handleNoteSubmit}
                disabled={!currentNote.trim()}
                className="w-full sm:w-auto"
              >
                {t('notes.saveNote')}
              </Button>
            </div>

            {/* 笔记列表区域 */}
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="rounded-lg border bg-card p-4">
                  {/* 原文 */}
                  <p className="text-lg mb-4 text-card-foreground">
                    {note.text}
                  </p>

                  {/* 翻译结果 */}
                  {note.translated_text && (
                    <p className="text-lg mb-4 text-primary">
                      <HighlightedText
                        text={note.translated_text}
                        currentWord={currentWord}
                      />
                    </p>
                  )}

                  {/* 操作按钮区域 */}
                  <div className="flex flex-wrap gap-4 items-center">
                    {/* 翻译按钮 */}
                    {!note.translated_text && (
                      <Button
                        variant="outline"
                        onClick={() => handleTranslate(note)}
                        disabled={isTranslating}
                        className="min-w-[120px]"
                      >
                        {isTranslating ? (
                          <Spinner className="mr-2" />
                        ) : null}
                        {isTranslating ? t('notes.translating') : t('notes.translate')}
                      </Button>
                    )}

                    {/* 音频生成按钮 */}
                    {note.translated_text && (
                      <div className="flex items-center gap-2">
                        {!note.audio_url && (
                          <Button
                            variant="outline"
                            onClick={() => generateAudio(note)}
                            disabled={isGeneratingAudio}
                            className="min-w-[120px]"
                          >
                            {isGeneratingAudio ? t('notes.generating') : t('notes.generateAudio')}
                          </Button>
                        )}

                        {/* 音频播放器 */}
                        {note.audio_url && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleAudioPlay(note.audio_url, note.translated_text)}
                              disabled={isPlaying}
                              className="min-w-[120px]"
                            >
                              {isPlaying ? t('notes.stop') : t('notes.play')}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 练习录音按钮 */}
                    {note.audio_url && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={isRecording ? stopRecording : startRecording}
                          className="min-w-[120px]"
                        >
                          {isRecording ? t('practice.stopRecording') : t('practice.startRecording')}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* 评分显示 */}
                  {currentPractice && currentPractice.noteId === note.id && (
                    <div className="mt-4">
                      <SpeakingScore scores={currentPractice.scores} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Box>
      )}
    </Box>
  );
}

export default App;