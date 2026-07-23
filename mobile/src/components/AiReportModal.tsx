import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { X, FileText, Sparkles, RefreshCw } from 'lucide-react-native';

import { apiClient } from '../lib/apiClient';

const XIcon = X as any;
const FileTextIcon = FileText as any;
const SparklesIcon = Sparkles as any;
const RefreshCwIcon = RefreshCw as any;

type AiReportModalProps = {
  visible: boolean;
  onClose: () => void;
  apiBaseUrl: string;
  authToken: string | null;
  financialContext: any;
};

export function AiReportModal({ visible, onClose, apiBaseUrl, authToken, financialContext }: AiReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const message = "Generate an executive summary report for my business finances, outlining the health score, net margins, trends, any anomalies, and actionable recommendations. Structure it with clear headers and bullet points.";
      
      const res = await apiClient.post('/ai/chat', {
        message,
        context: financialContext,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate AI report');
      }

      setReport(data.reply || 'No analysis available.');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to generate report. Make sure GEMINI_API_KEY is configured on the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchReport();
    }
  }, [visible]);

  // Simple Markdown renderer
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content = line.trim();
      let style: any = styles.mdBody;
      let bullet = false;

      if (!content) return <View key={idx} style={{ height: 8 }} />;

      // Header Check
      if (content.startsWith('###')) {
        content = content.replace('###', '').trim();
        style = styles.mdH3;
      } else if (content.startsWith('##')) {
        content = content.replace('##', '').trim();
        style = styles.mdH2;
      } else if (content.startsWith('#')) {
        content = content.replace('#', '').trim();
        style = styles.mdH1;
      }
      // Bullet check
      else if (content.startsWith('-') || content.startsWith('*')) {
        content = content.substring(1).trim();
        bullet = true;
      }

      // Parse bolding (**text**)
      const parts = content.split('**');
      const textElements = parts.map((part, pIdx) => {
        const isBold = pIdx % 2 === 1;
        return (
          <Text key={pIdx} style={isBold ? styles.bold : null}>
            {part}
          </Text>
        );
      });

      return (
        <View key={idx} style={[styles.mdLine, bullet && styles.bulletLine]}>
          {bullet && <Text style={styles.bulletDot}>•</Text>}
          <Text style={style}>{textElements}</Text>
        </View>
      );
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <SparklesIcon color="#4f8cff" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.title}>AI Executive Report</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <XIcon color="#a6bedf" size={24} />
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          <ScrollView 
            style={styles.contentScroll} 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color="#4f8cff" size="large" />
                <Text style={styles.loadingText}>Analyzing financial metrics...</Text>
                <Text style={styles.loadingSubtext}>Gemini AI is processing your cashflow stats</Text>
              </View>
            ) : errorMsg ? (
              <View style={styles.errorWrap}>
                <Text style={styles.errorTitle}>Analysis Unavailable</Text>
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchReport}>
                  <RefreshCwIcon color="#ffffff" size={16} style={{ marginRight: 6 }} />
                  <Text style={styles.retryText}>Retry analysis</Text>
                </TouchableOpacity>
              </View>
            ) : report ? (
              <View style={styles.reportWrap}>
                <View style={styles.disclaimerBox}>
                  <Text style={styles.disclaimerText}>
                    💡 This report is generated dynamically by Google Gemini using your uploaded transactions and runway metrics.
                  </Text>
                </View>
                {renderMarkdown(report)}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 8, 16, 0.9)',
  },
  card: {
    flex: 1,
    backgroundColor: '#06111f',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: '#15345f',
    marginTop: 40,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#15345f',
    backgroundColor: '#0b1d38',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  closeBtn: {
    padding: 4,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 18,
  },
  loadingSubtext: {
    color: '#8fc0ff',
    fontSize: 13,
    marginTop: 6,
  },
  errorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  errorTitle: {
    color: '#ff8f8f',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    color: '#a6bedf',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f8cff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  reportWrap: {
    width: '100%',
  },
  disclaimerBox: {
    backgroundColor: '#0b1d38',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#15345f',
    marginBottom: 24,
  },
  disclaimerText: {
    color: '#8fc0ff',
    fontSize: 13,
    lineHeight: 18,
  },
  mdLine: {
    marginBottom: 10,
  },
  bulletLine: {
    flexDirection: 'row',
    paddingLeft: 10,
    alignItems: 'flex-start',
  },
  bulletDot: {
    color: '#4f8cff',
    fontSize: 16,
    marginRight: 8,
    lineHeight: 20,
  },
  mdH1: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 18,
    marginBottom: 8,
  },
  mdH2: {
    fontSize: 18,
    fontWeight: '800',
    color: '#8fc0ff',
    marginTop: 16,
    marginBottom: 6,
  },
  mdH3: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 4,
  },
  mdBody: {
    fontSize: 14,
    color: '#c3d6f3',
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: '#ffffff',
  },
});
