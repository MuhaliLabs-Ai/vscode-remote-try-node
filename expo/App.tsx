import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  PanResponder,
  Animated,
  Share,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FloatingWidgetProps {
  isListening: boolean;
  onToggleListen: () => void;
  currentAnswer: {
    question: string;
    quickAnswer: string;
    talkingPoints: string[];
    explanation: string;
  };
  liveVoiceTranscript: string;
  activeSpokenEntities: string[];
  isVoiceActive: boolean;
  onTriggerVoiceSync: () => void;
}

// -------------------------------------------------------------
// PERSISTENT FLOATING WIDGET FOR EXPO GO MOBILE APP
// -------------------------------------------------------------
const FloatingMobileWidget: React.FC<FloatingWidgetProps> = ({
  isListening,
  onToggleListen,
  currentAnswer,
  liveVoiceTranscript,
  activeSpokenEntities,
  isVoiceActive,
  onTriggerVoiceSync,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Dragging coordinates via Animated.ValueXY
  const pan = useRef(
    new Animated.ValueXY({
      x: SCREEN_WIDTH - 76,
      y: SCREEN_HEIGHT - 210,
    })
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only treat as drag if moved more than 4 pixels to avoid blocking simple taps
        return Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          // @ts-ignore
          x: pan.x._value,
          // @ts-ignore
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        // Clamping to screen edges
        // @ts-ignore
        let currentX = pan.x._value;
        // @ts-ignore
        let currentY = pan.y._value;

        const widgetW = isExpanded ? 330 : 64;
        const widgetH = isExpanded ? 440 : 64;

        const minX = 12;
        const maxX = SCREEN_WIDTH - widgetW - 12;
        const minY = 50;
        const maxY = SCREEN_HEIGHT - widgetH - 70;

        Animated.spring(pan, {
          toValue: {
            x: Math.max(minX, Math.min(maxX, currentX)),
            y: Math.max(minY, Math.min(maxY, currentY)),
          },
          useNativeDriver: false,
          friction: 6,
        }).start();
      },
    })
  ).current;

  // Visual Nodes for live voice-to-visual response mapping
  const visualNodes = [
    { id: '1', label: 'Client Ingress', role: 'HTTPS 1.3' },
    { id: '2', label: 'Azure API Mgmt', role: 'Gateway & JWT' },
    { id: '3', label: 'ASP.NET Core API', role: 'Stateless Autoscaled' },
    { id: '4', label: 'Azure Redis Cache', role: 'Read Model <2ms' },
    { id: '5', label: 'Azure SQL / Cosmos', role: 'Persistence Store' },
  ];

  return (
    <Animated.View
      style={[
        styles.floatingContainer,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {!isExpanded ? (
        // -------------------------------------------------------------
        // COLLAPSED FLOATING LAUNCHER PILL
        // -------------------------------------------------------------
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setIsExpanded(true)}
          style={[
            styles.collapsedLauncher,
            isListening && styles.collapsedLauncherListening,
            isVoiceActive && styles.collapsedLauncherVoiceActive,
          ]}
        >
          <View style={styles.launcherLogo}>
            <Text style={styles.launcherLogoText}>AB</Text>
          </View>

          {isVoiceActive ? (
            <View style={styles.voiceWaveRow}>
              <View style={[styles.waveBar, styles.waveBar1]} />
              <View style={[styles.waveBar, styles.waveBar2]} />
              <View style={[styles.waveBar, styles.waveBar3]} />
            </View>
          ) : (
            <View
              style={[
                styles.miniStatusDot,
                isListening ? styles.dotListening : styles.dotIdle,
              ]}
            />
          )}

          <Text style={styles.launcherBadgeText}>
            {isVoiceActive ? 'Voice' : isListening ? 'Live' : 'Copilot'}
          </Text>
        </TouchableOpacity>
      ) : (
        // -------------------------------------------------------------
        // EXPANDED FLOATING COPILOT CARD (OVERLAY OVER ANY APP TAB)
        // -------------------------------------------------------------
        <View style={styles.expandedCard}>
          {/* Draggable Drag Handle & Header */}
          <View style={styles.floatingHeader}>
            <View style={styles.dragHandleBar} />
            <View style={styles.floatingHeaderRow}>
              <View style={styles.floatingTitleGroup}>
                <View style={styles.miniLogo}>
                  <Text style={styles.miniLogoText}>AB</Text>
                </View>
                <View>
                  <Text style={styles.floatingTitle}>Applebee Copilot</Text>
                  <Text style={styles.floatingSubtitle}>
                    {isVoiceActive ? 'Voice sync demo' : isListening ? 'Recording audio' : 'Floating Widget'}
                  </Text>
                </View>
              </View>

              <View style={styles.floatingHeaderActions}>
                <TouchableOpacity
                  onPress={onToggleListen}
                  style={[
                    styles.miniHeaderButton,
                    isListening ? styles.miniHeaderButtonActive : styles.miniHeaderButtonInactive,
                  ]}
                >
                  <Text style={styles.miniButtonText}>{isListening ? 'Mute' : 'Listen'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsExpanded(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Scrollable Floating Content */}
          <ScrollView
            style={styles.floatingScroll}
            contentContainerStyle={styles.floatingScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Live Voice Response Transcribed Stream */}
            <View style={styles.transcriptionStreamBox}>
              <View style={styles.transcriptionHeader}>
                <View style={styles.liveVoiceIndicator}>
                  <View style={[styles.pulseDot, isVoiceActive && styles.pulseDotActive]} />
                  <Text style={styles.transcriptionTitle}>
                    {isVoiceActive ? 'VOICE-TO-VISUAL DEMO' : 'AUDIO TRANSCRIPTION'}
                  </Text>
                </View>
                <TouchableOpacity onPress={onTriggerVoiceSync}>
                  <Text style={styles.voiceSyncBtnText}>Run demo</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.transcriptionText}>
                {liveVoiceTranscript || 'Mobile audio capture is not transcribed. Use the web cockpit for speech recognition.'}
              </Text>
            </View>

            {/* LIVE VOICE-TO-VISUAL DIAGRAM (Converts voice response to visual cards) */}
            <View style={styles.visualDiagramCard}>
              <View style={styles.visualHeaderRow}>
                <Text style={styles.visualLabel}>DYNAMIC ARCHITECTURE TOPOLOGY</Text>
                {activeSpokenEntities.length > 0 && (
                  <Text style={styles.voiceSyncActiveTag}>Voice Synced</Text>
                )}
              </View>

              {/* Dynamic Nodes with Active Spoken Highlight */}
              <View style={styles.nodesGrid}>
                {visualNodes.map((node) => {
                  const isNodeSpoken = activeSpokenEntities.some(
                    (entity) =>
                      node.label.toLowerCase().includes(entity.toLowerCase()) ||
                      entity.toLowerCase().includes(node.label.toLowerCase())
                  );

                  return (
                    <View
                      key={node.id}
                      style={[
                        styles.topologyNode,
                        isNodeSpoken && styles.topologyNodeSpoken,
                      ]}
                    >
                      <View style={styles.nodeTopRow}>
                        <Text style={[styles.nodeRole, isNodeSpoken && styles.nodeRoleSpoken]}>
                          {node.role}
                        </Text>
                        {isNodeSpoken && (
                          <View style={styles.activeVoiceBadge}>
                            <Text style={styles.activeVoiceBadgeText}>ACTIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.nodeLabel, isNodeSpoken && styles.nodeLabelSpoken]}>
                        {node.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Glanceable 5-Second Quick Answer */}
            <View style={styles.quickAnswerBox}>
              <Text style={styles.quickAnswerHeader}>⚡ 5-SECOND ANSWER</Text>
              <Text style={styles.quickAnswerContent}>{currentAnswer.quickAnswer}</Text>
            </View>

            {/* Key Talking Points */}
            <View style={styles.talkingPointsBox}>
              <Text style={styles.talkingPointsHeader}>ACTIONABLE TALKING POINTS</Text>
              {currentAnswer.talkingPoints.slice(0, 3).map((pt, i) => (
                <View key={i} style={styles.pointRow}>
                  <Text style={styles.pointDot}>•</Text>
                  <Text style={styles.pointText}>{pt}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Floating Footer Toolbar */}
          <View style={styles.floatingFooter}>
            <Text style={styles.dockNoticeText}>Drag header to move anywhere</Text>
            <TouchableOpacity onPress={() => setIsExpanded(false)} style={styles.dockButton}>
              <Text style={styles.dockButtonText}>Dock to Corner</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

// -------------------------------------------------------------
// MAIN EXPO GO APPLICATION COMPONENT
// -------------------------------------------------------------
export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [activeTab, setActiveTab] = useState<'copilot' | 'transcript' | 'visual' | 'profile'>('copilot');
  const [serverUrl, setServerUrl] = useState('');
  const [questionInput, setQuestionInput] = useState('');
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const [answerError, setAnswerError] = useState('');

  // Live Voice Response Transcription & Voice-to-Visual Synchronization
  const [liveVoiceTranscript, setLiveVoiceTranscript] = useState('');
  const [activeSpokenEntities, setActiveSpokenEntities] = useState<string[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Empty until the backend returns an answer for a user-entered question.
  const [currentAnswer, setCurrentAnswer] = useState({
    question: '',
    quickAnswer: '',
    talkingPoints: [] as string[],
    explanation: '',
    tradeoffs: [] as string[],
    followUp: '',
  });

  const [transcript, setTranscript] = useState<{ id: string; speaker: string; text: string; time: string }[]>([]);

  const requestAnswer = async () => {
    const apiBaseUrl = serverUrl.trim().replace(/\/+$/, '');
    const question = questionInput.trim();
    if (!apiBaseUrl || !question) {
      setAnswerError('Enter the web server URL and an interview question.');
      return;
    }

    setIsAnswerLoading(true);
    setAnswerError('');
    try {
      const response = await fetch(`${apiBaseUrl}/api/interview/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          role: 'Senior .NET & Azure Cloud Architect',
          useSearchGrounding: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Answer service returned HTTP ${response.status}`);
      if (typeof data.quickAnswer !== 'string' || !Array.isArray(data.talkingPoints)) {
        throw new Error('The answer service returned an incomplete response.');
      }
      setCurrentAnswer({
        question: data.question || question,
        quickAnswer: data.quickAnswer,
        talkingPoints: data.talkingPoints,
        explanation: data.explanation || '',
        tradeoffs: data.tradeoffs || [],
        followUp: data.followUps?.[0] || '',
      });
      setTranscript((current) => [
        ...current,
        {
          id: `typed_${Date.now()}`,
          speaker: 'You (typed)',
          text: question,
          time: new Date().toLocaleTimeString(),
        },
      ]);
      setQuestionInput('');
    } catch (error) {
      setAnswerError(error instanceof Error ? error.message : 'Could not reach the answer service.');
    } finally {
      setIsAnswerLoading(false);
    }
  };

  // Request microphone permission via Expo AV
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        alert('Microphone permission is required to listen to live interview questions.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      setAnswerError(err instanceof Error ? err.message : 'Could not start microphone recording.');
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch (err) {
        setAnswerError(err instanceof Error ? err.message : 'Could not stop microphone recording.');
      }
      setRecording(null);
    }
  };

  // Simulates live voice response streaming and converts it back into visual diagram highlights
  const triggerVoiceSyncSimulation = () => {
    setIsVoiceActive(true);
    const spokenSteps = [
      {
        transcript: 'Client ingress arrives through Azure API Management for rate limiting and token authentication.',
        entities: ['Client Ingress', 'Azure API Mgmt'],
      },
      {
        transcript: 'Requests route directly to stateless ASP.NET Core API microservices running on autoscaling container clusters.',
        entities: ['ASP.NET Core API'],
      },
      {
        transcript: 'High-frequency read queries leverage Azure Cache for Redis to guarantee sub-5 millisecond p99 latency.',
        entities: ['Azure Redis Cache'],
      },
      {
        transcript: 'Persistence operations flow into Azure SQL and Cosmos DB with Polly handling circuit-breaker retries.',
        entities: ['Azure SQL / Cosmos'],
      },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep >= spokenSteps.length) {
        clearInterval(interval);
        setIsVoiceActive(false);
        return;
      }

      setLiveVoiceTranscript(spokenSteps[currentStep].transcript);
      setActiveSpokenEntities(spokenSteps[currentStep].entities);
      currentStep++;
    }, 1800);
  };

  const shareAnswer = async () => {
    try {
      await Share.share({
        message: `Applebee Live Interview Response:\n\nQ: ${currentAnswer.question}\n\nQuick Answer: ${currentAnswer.quickAnswer}\n\nTalking Points:\n${currentAnswer.talkingPoints.map((tp) => `• ${tp}`).join('\n')}`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />

      {/* Mobile Top Bar */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>AB</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>Applebee Mobile</Text>
            <Text style={styles.brandSubtitle}>Expo Go Live Interview Copilot</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={[styles.recordButton, isRecording ? styles.recordButtonActive : styles.recordButtonInactive]}
        >
          <View style={[styles.statusDot, isRecording ? styles.statusDotActive : styles.statusDotInactive]} />
          <Text style={styles.recordButtonText}>{isRecording ? 'Recording' : 'Record audio'}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Screen Content View by Tab */}
      <View style={styles.content}>
        {activeTab === 'copilot' && (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>ASK THE ANSWER SERVICE</Text>
              <TextInput
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="Web server URL, e.g. http://192.168.1.20:3000"
                placeholderTextColor="#71717a"
                autoCapitalize="none"
                keyboardType="url"
                style={styles.questionInput}
              />
              <TextInput
                value={questionInput}
                onChangeText={setQuestionInput}
                placeholder="Enter an interview question"
                placeholderTextColor="#71717a"
                style={styles.questionInput}
                onSubmitEditing={requestAnswer}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={requestAnswer}
                disabled={isAnswerLoading}
                style={[styles.askButton, isAnswerLoading && styles.askButtonDisabled]}
              >
                {isAnswerLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.askButtonText}>Generate answer</Text>}
              </TouchableOpacity>
              {!!answerError && <Text style={styles.errorText}>{answerError}</Text>}
              <Text style={styles.transcriptionText}>
                Audio recording is local only. This mobile client does not transcribe or stream microphone audio.
              </Text>
            </View>
            {!currentAnswer.question ? (
              <Text style={styles.emptyStateText}>Your structured answer will appear here after you submit a question.</Text>
            ) : (
              <>
            {/* Detected Question Banner */}
            <View style={styles.questionCard}>
              <View style={styles.tagRow}>
                <Text style={styles.typeTag}>AZURE & .NET CLOUD</Text>
                <TouchableOpacity onPress={shareAnswer}>
                  <Text style={styles.actionLink}>Share</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.questionHeading}>"{currentAnswer.question}"</Text>
            </View>

            {/* Quick Answer */}
            <View style={styles.quickAnswerCard}>
              <Text style={styles.quickAnswerLabel}>⚡ 5-SECOND ESSENTIAL ANSWER</Text>
              <Text style={styles.quickAnswerText}>{currentAnswer.quickAnswer}</Text>
            </View>

            {/* Talking Points */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>KEY TALKING POINTS</Text>
              {currentAnswer.talkingPoints.map((tp, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{tp}</Text>
                </View>
              ))}
            </View>

            {/* Trade-offs */}
            <View style={styles.warningCard}>
              <Text style={styles.warningLabel}>ENGINEERING TRADE-OFFS & CAVEATS</Text>
              {currentAnswer.tradeoffs.map((item, i) => (
                <Text key={i} style={styles.warningText}>• {item}</Text>
              ))}
            </View>

            {/* Follow-up question */}
            <View style={styles.card}>
              <Text style={styles.followUpLabel}>LIKELY INTERVIEWER FOLLOW-UP:</Text>
              <Text style={styles.followUpText}>"{currentAnswer.followUp}"</Text>
            </View>
              </>
            )}
          </ScrollView>
        )}

        {activeTab === 'transcript' && (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionHeader}>Question History</Text>
            {transcript.length === 0 && <Text style={styles.emptyStateText}>No questions submitted yet. Recorded audio is not transcribed in this mobile client.</Text>}
            {transcript.map((seg) => (
              <View key={seg.id} style={styles.transcriptCard}>
                <View style={styles.transcriptMeta}>
                  <Text style={styles.speakerText}>{seg.speaker}</Text>
                  <Text style={styles.timeText}>{seg.time}</Text>
                </View>
                <Text style={styles.transcriptBody}>{seg.text}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {activeTab === 'visual' && (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionHeader}>Full System Topology Model</Text>
            <View style={styles.diagramContainer}>
              <View style={styles.diagramNode}>
                <Text style={styles.nodeType}>INGRESS</Text>
                <Text style={styles.nodeLabel}>Client (Web / Mobile Apps)</Text>
              </View>
              <Text style={styles.diagramArrow}>▼ HTTPS / TLS 1.3</Text>
              <View style={styles.diagramNode}>
                <Text style={styles.nodeType}>GATEWAY</Text>
                <Text style={styles.nodeLabel}>Azure API Management (Rate Limiter & Auth)</Text>
              </View>
              <Text style={styles.diagramArrow}>▼ Mutual TLS / JWT</Text>
              <View style={[styles.diagramNode, styles.diagramNodeHighlight]}>
                <Text style={styles.nodeType}>COMPUTE</Text>
                <Text style={styles.nodeLabel}>ASP.NET Core API Cluster (AKS / App Service)</Text>
              </View>
              <Text style={styles.diagramArrow}>▼ Low-Latency Cache & Persistence</Text>
              <View style={styles.diagramRow}>
                <View style={[styles.diagramNodeHalf]}>
                  <Text style={styles.nodeType}>CACHE</Text>
                  <Text style={styles.nodeLabel}>Azure Redis</Text>
                </View>
                <View style={[styles.diagramNodeHalf]}>
                  <Text style={styles.nodeType}>DATABASE</Text>
                  <Text style={styles.nodeLabel}>Azure SQL / Cosmos</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === 'profile' && (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionHeader}>Candidate Profile</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>CANDIDATE DETAILS</Text>
              <Text style={styles.profileRole}>Senior .NET & Azure Cloud Architect</Text>
              <Text style={styles.profileExp}>Personal profile details are not configured in this mobile client.</Text>
            </View>
          </ScrollView>
        )}
      </View>

      {/* ------------------------------------------------------------- */}
      {/* PERSISTENT FLOATING WIDGET HOVERING OVER ALL MOBILE SCREENS    */}
      {/* ------------------------------------------------------------- */}
      <FloatingMobileWidget
        isListening={isRecording}
        onToggleListen={isRecording ? stopRecording : startRecording}
        currentAnswer={currentAnswer}
        liveVoiceTranscript={liveVoiceTranscript}
        activeSpokenEntities={activeSpokenEntities}
        isVoiceActive={isVoiceActive}
        onTriggerVoiceSync={triggerVoiceSyncSimulation}
      />

      {/* Bottom Navigation Tabs */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('copilot')}>
          <Text style={[styles.navText, activeTab === 'copilot' && styles.navTextActive]}>Copilot</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('transcript')}>
          <Text style={[styles.navText, activeTab === 'transcript' && styles.navTextActive]}>Transcript</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('visual')}>
          <Text style={[styles.navText, activeTab === 'visual' && styles.navTextActive]}>Diagrams</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
          <Text style={[styles.navText, activeTab === 'profile' && styles.navTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// -------------------------------------------------------------
// STYLES
// -------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    backgroundColor: '#09090b',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  brandTitle: {
    color: '#f4f4f5',
    fontSize: 15,
    fontWeight: '700',
  },
  brandSubtitle: {
    color: '#a1a1aa',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  recordButtonInactive: {
    backgroundColor: '#18181b',
    borderColor: '#3f3f46',
  },
  recordButtonActive: {
    backgroundColor: '#052e16',
    borderColor: '#10b981',
  },
  recordButtonText: {
    color: '#f4f4f5',
    fontSize: 12,
    fontWeight: '600',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotInactive: {
    backgroundColor: '#71717a',
  },
  statusDotActive: {
    backgroundColor: '#10b981',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 80,
  },
  questionCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeTag: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  actionLink: {
    color: '#a1a1aa',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  questionHeading: {
    color: '#f4f4f5',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  questionInput: {
    backgroundColor: '#09090b',
    borderColor: '#3f3f46',
    borderWidth: 1,
    borderRadius: 8,
    color: '#f4f4f5',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
  },
  askButton: {
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    minHeight: 38,
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  askButtonDisabled: {
    opacity: 0.65,
  },
  askButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#fda4af',
    fontSize: 11,
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 18,
    padding: 12,
  },
  quickAnswerCard: {
    backgroundColor: '#3b0764',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#7e22ce',
  },
  quickAnswerLabel: {
    color: '#d8b4fe',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  quickAnswerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cardTitle: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  bulletDot: {
    color: '#34d399',
    fontSize: 14,
    lineHeight: 18,
  },
  bulletText: {
    color: '#e4e4e7',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  warningCard: {
    backgroundColor: '#451a03',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#b45309',
  },
  warningLabel: {
    color: '#fcd34d',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  warningText: {
    color: '#fef3c7',
    fontSize: 11,
    lineHeight: 16,
  },
  followUpLabel: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  followUpText: {
    color: '#38bdf8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  sectionHeader: {
    color: '#f4f4f5',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  transcriptCard: {
    backgroundColor: '#18181b',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 8,
  },
  transcriptMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  speakerText: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  timeText: {
    color: '#71717a',
    fontSize: 10,
  },
  transcriptBody: {
    color: '#e4e4e7',
    fontSize: 12,
    lineHeight: 17,
  },
  diagramContainer: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    gap: 8,
  },
  diagramNode: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    padding: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  diagramNodeHighlight: {
    backgroundColor: '#3b0764',
    borderColor: '#9333ea',
  },
  diagramRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  diagramNodeHalf: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  nodeType: {
    color: '#a1a1aa',
    fontSize: 9,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  nodeLabel: {
    color: '#f4f4f5',
    fontSize: 11,
    fontWeight: '600',
  },
  diagramArrow: {
    color: '#71717a',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  profileName: {
    color: '#f4f4f5',
    fontSize: 15,
    fontWeight: '700',
  },
  profileRole: {
    color: '#c084fc',
    fontSize: 12,
    marginBottom: 4,
  },
  profileExp: {
    color: '#a1a1aa',
    fontSize: 11,
    marginBottom: 4,
  },
  profileSkills: {
    color: '#e4e4e7',
    fontSize: 11,
    lineHeight: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    backgroundColor: '#09090b',
    paddingVertical: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#c084fc',
    fontWeight: '700',
  },

  // -----------------------------------------------------------
  // FLOATING WIDGET STYLES
  // -----------------------------------------------------------
  floatingContainer: {
    position: 'absolute',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 20,
  },
  collapsedLauncher: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#18181b',
    borderWidth: 2,
    borderColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  collapsedLauncherListening: {
    borderColor: '#10b981',
    shadowColor: '#10b981',
  },
  collapsedLauncherVoiceActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#0c4a6e',
  },
  launcherLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  launcherLogoText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  launcherBadgeText: {
    color: '#f4f4f5',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  miniStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    position: 'absolute',
    top: 6,
    right: 8,
  },
  dotListening: {
    backgroundColor: '#10b981',
  },
  dotIdle: {
    backgroundColor: '#71717a',
  },
  voiceWaveRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
    position: 'absolute',
    top: 6,
    right: 6,
  },
  waveBar: {
    width: 2,
    backgroundColor: '#38bdf8',
    borderRadius: 1,
  },
  waveBar1: { height: 6 },
  waveBar2: { height: 10 },
  waveBar3: { height: 7 },

  // Expanded Floating Card
  expandedCard: {
    width: SCREEN_WIDTH > 360 ? 330 : SCREEN_WIDTH - 24,
    maxHeight: 460,
    backgroundColor: '#121215',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#7c3aed',
    overflow: 'hidden',
  },
  floatingHeader: {
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
  },
  dragHandleBar: {
    width: 32,
    height: 3,
    backgroundColor: '#52525b',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 6,
  },
  floatingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniLogo: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLogoText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  floatingTitle: {
    color: '#f4f4f5',
    fontSize: 12,
    fontWeight: '700',
  },
  floatingSubtitle: {
    color: '#a1a1aa',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  floatingHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniHeaderButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  miniHeaderButtonInactive: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  miniHeaderButtonActive: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  miniButtonText: {
    color: '#f4f4f5',
    fontSize: 10,
    fontWeight: '600',
  },
  closeButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: 'bold',
  },
  floatingScroll: {
    maxHeight: 360,
  },
  floatingScrollContent: {
    padding: 12,
    gap: 10,
  },
  transcriptionStreamBox: {
    backgroundColor: '#18181b',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  transcriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  liveVoiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#71717a',
  },
  pulseDotActive: {
    backgroundColor: '#38bdf8',
  },
  transcriptionTitle: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  voiceSyncBtnText: {
    color: '#c084fc',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  transcriptionText: {
    color: '#e4e4e7',
    fontSize: 11,
    lineHeight: 16,
  },
  visualDiagramCard: {
    backgroundColor: '#18181b',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  visualHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  visualLabel: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  voiceSyncActiveTag: {
    color: '#34d399',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  nodesGrid: {
    gap: 5,
  },
  topologyNode: {
    backgroundColor: '#27272a',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  topologyNodeSpoken: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  nodeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  nodeRole: {
    color: '#a1a1aa',
    fontSize: 8,
    fontFamily: 'monospace',
  },
  nodeRoleSpoken: {
    color: '#a7f3d0',
  },
  activeVoiceBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  activeVoiceBadgeText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'bold',
  },
  nodeLabelSpoken: {
    color: '#ecfdf5',
    fontWeight: '700',
  },
  quickAnswerBox: {
    backgroundColor: '#3b0764',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#7e22ce',
  },
  quickAnswerHeader: {
    color: '#d8b4fe',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 3,
  },
  quickAnswerContent: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  talkingPointsBox: {
    backgroundColor: '#18181b',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  talkingPointsHeader: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  pointRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 3,
  },
  pointDot: {
    color: '#34d399',
    fontSize: 12,
  },
  pointText: {
    color: '#e4e4e7',
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
  floatingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#18181b',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  dockNoticeText: {
    color: '#71717a',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  dockButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#27272a',
  },
  dockButtonText: {
    color: '#c084fc',
    fontSize: 9,
    fontWeight: '600',
  },
});
