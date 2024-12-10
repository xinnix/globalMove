import React, { useState, useEffect, useRef } from 'react';
import './styles/globals.css';
import { Button } from './components/ui/button';
import { Spinner } from './components/ui/spinner';
import { Translate } from '@mui/icons-material';
import WaveformDisplay from './components/WaveformDisplay';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import { useAuth } from './contexts/AuthContext';
import api from './services/api';
import HighlightedText from './components/HighlightedText';
import ActivityHeatmap from './components/ActivityHeatmap';
import SpeakingScore from './components/SpeakingScore';
import { useTranslation } from 'react-i18next';
import './i18n';

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
      const response = await api.notes.list();
      setNotes(response.data);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data } = await api.activities.list();
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    }
  };

  useEffect(() => {
    if (user) {
      // 获取用户活动数据
      api.activities.list()
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
      const response = await api.notes.create({
        text: currentNote,
      });
      
      setNotes([response.data, ...notes]);
      setCurrentNote('');
      setActiveStep(1);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleTranslate = async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    setIsTranslating(true);
    setError(null); // 清除之前的错误
    try {
      const response = await api.translate.text({ text: note.text });
      const updatedNotes = notes.map(n => {
        if (n.id === noteId) {
          return { ...n, translated_text: response.data.translatedText };
        }
        return n;
      });

      setNotes(updatedNotes);
      await api.notes.update(noteId, { translated_text: response.data.translatedText });
      setActiveStep(2);
    } catch (error) {
      console.error('Translation error:', error);
      setError(error.response?.data?.error || 'Translation failed. Please try again.');
      return; // 翻译失败时不继续后续操作
    } finally {
      setIsTranslating(false);
    }
  };

  const generateAudio = async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.translated_text) {
      setError('No translated text available for audio generation.');
      return;
    }

    setError(null); // 清除之前的错误
    try {
      setIsGeneratingAudio(true);
      const response = await api.tts.generate({ text: note.translated_text });
      
      // 创建一个新的音频元素来测试 URL
      const audio = new Audio(response.data.audioUrl);
      await new Promise((resolve, reject) => {
        audio.oncanplaythrough = resolve;
        audio.onerror = () => reject(new Error('Failed to load audio'));
        audio.load();
      });

      const updatedNotes = notes.map(n => {
        if (n.id === noteId) {
          return { ...n, audio_url: response.data.audioUrl };
        }
        return n;
      });

      setNotes(updatedNotes);
      await api.notes.update(noteId, { audio_url: response.data.audioUrl });
      setActiveStep(3);
    } catch (error) {
      console.error('Audio generation error:', error);
      setError(error.response?.data?.error || 'Failed to generate audio. Please try again.');
    } finally {
      setIsGeneratingAudio(false);
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
          await handleTranslate(note.id);
        }
        if (note.translated_text && !note.audio_url) {
          await generateAudio(note.id);
        }
      });
    }
  }, [notes, handleTranslate, generateAudio]);

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await submitPractice(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 提交练习
  const submitPractice = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('noteId', currentNote.id);

      const response = await api.practices.create(formData);
      const practice = await response.data;
      setCurrentPractice(practice);
      fetchActivities(); // 更新活动热力图
    } catch (error) {
      console.error('Error submitting practice:', error);
    }
  };

  if (!user) {
    return (
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
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
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
                    onClick={() => handleTranslate(note.id)}
                    disabled={isTranslating}
                    className="min-w-[120px]"
                  >
                    {isTranslating ? (
                      <Spinner className="mr-2" />
                    ) : null}
                    {isTranslating ? t('notes.translating') : t('notes.translate')}
                  </Button>
                )}

                {/* 音频控制区域 */}
                {note.translated_text && (
                  <div className="w-full space-y-4">
                    <div className="flex flex-wrap gap-4">
                      {!note.audio_url && (
                        <Button
                          variant="outline"
                          onClick={() => generateAudio(note.id)}
                          disabled={isGeneratingAudio}
                          className="min-w-[120px]"
                        >
                          {isGeneratingAudio ? (
                            <Spinner className="mr-2" />
                          ) : null}
                          {isGeneratingAudio ? t('notes.generating') : t('notes.generateAudio')}
                        </Button>
                      )}
                      {note.audio_url && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => handleAudioPlay(note.audio_url, note.translated_text)}
                            className="min-w-[100px]"
                          >
                            {isPlaying ? t('notes.stop') : t('notes.play')}
                          </Button>
                          <Button
                            variant={isRecording ? "destructive" : "default"}
                            onClick={isRecording ? stopRecording : startRecording}
                            className="min-w-[120px]"
                          >
                            {isRecording ? t('practice.stopRecording') : t('practice.startRecording')}
                          </Button>
                        </>
                      )}
                    </div>
                    {note.audio_url && (
                      <div className="w-full">
                        <WaveformDisplay
                          duration={duration}
                          currentTime={currentTime}
                          isPlaying={isPlaying}
                        />
                      </div>
                    )}
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
    </div>
  );
}

export default App;