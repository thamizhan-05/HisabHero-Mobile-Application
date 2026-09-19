import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  Share,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { X, Copy, Share2, Check, ShieldCheck, QrCode } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../theme/themeSystem';

interface UpiPaymentQrModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  amount: number;
  invoiceNumber?: string;
  customerName?: string;
  defaultVpa?: string;
  businessName?: string;
}

export function UpiPaymentQrModal({
  visible,
  onClose,
  title,
  amount,
  invoiceNumber,
  customerName,
  defaultVpa = 'hisabhero.merchant@okhdfcbank',
  businessName = 'HisabHero Merchant',
}: UpiPaymentQrModalProps) {
  const { theme, accentHex } = useTheme();
  const [vpa, setVpa] = useState(defaultVpa);
  const [isEditingVpa, setIsEditingVpa] = useState(false);
  const [copied, setCopied] = useState(false);

  // Clean formatted parameters
  const cleanAmount = Number(amount || 0).toFixed(2);
  const note = encodeURIComponent(invoiceNumber ? `Payment for ${invoiceNumber}` : `Khata settlement`);
  const encodedName = encodeURIComponent(businessName);
  
  // Standard NPCI UPI URI Specification
  const upiUri = `upi://pay?pa=${vpa.trim()}&pn=${encodedName}&am=${cleanAmount}&cu=INR&tn=${note}`;

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(upiUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Copied', 'UPI payment link copied to clipboard.');
    }
  };

  const handleShareWhatsApp = async () => {
    const text = `Namaste ${customerName || 'Customer'} 🙏\n\nPlease find the UPI payment link for ₹${Number(amount).toLocaleString('en-IN')}${invoiceNumber ? ` (Invoice ${invoiceNumber})` : ''}:\n\n🔗 ${upiUri}\n\nYou can pay via Google Pay, PhonePe, Paytm, or BHIM.\n\nThank you,\n${businessName}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Share.share({ message: text, title: 'UPI Payment Link' });
      }
    } catch {
      await Share.share({ message: text, title: 'UPI Payment Link' });
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <QrCode color={accentHex} size={22} style={{ marginRight: 8 }} />
              <Text style={[styles.title, { color: theme.text }]}>{title || 'Collect UPI Payment'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={theme.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          {/* Amount Showcase Badge */}
          <View style={[styles.amountBadge, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Total Amount Due</Text>
            <Text style={[styles.amountValue, { color: accentHex }]}>₹{Number(amount).toLocaleString('en-IN')}</Text>
            {customerName ? (
              <Text style={[styles.metaText, { color: theme.textMuted }]}>Party: {customerName}</Text>
            ) : null}
          </View>

          {/* QR Code Container */}
          <View style={[styles.qrWrapper, { backgroundColor: '#ffffff', borderColor: theme.cardBorder }]}>
            <QRCode
              value={upiUri}
              size={190}
              color="#0f172a"
              backgroundColor="#ffffff"
              logoSize={34}
              logoMargin={4}
              logoBorderRadius={8}
            />
          </View>

          <Text style={[styles.scanHint, { color: theme.textSecondary }]}>
            Scan with <Text style={{ fontWeight: '700', color: theme.text }}>GPay, PhonePe, Paytm, BHIM</Text>
          </Text>

          {/* Merchant VPA Config Row */}
          <View style={[styles.vpaRow, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.vpaLabel, { color: theme.textMuted }]}>Receiving UPI ID (VPA):</Text>
              {isEditingVpa ? (
                <TextInput
                  style={[styles.vpaInput, { color: theme.text, borderColor: accentHex }]}
                  value={vpa}
                  onChangeText={setVpa}
                  placeholder="yourname@upi"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="none"
                />
              ) : (
                <Text style={[styles.vpaValue, { color: theme.text }]} numberOfLines={1}>{vpa}</Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.vpaEditBtn, { borderColor: theme.cardBorder }]}
              onPress={() => setIsEditingVpa(!isEditingVpa)}
            >
              <Text style={[styles.vpaEditText, { color: accentHex }]}>
                {isEditingVpa ? 'Save' : 'Change'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.copyBtn, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
              onPress={handleCopyLink}
            >
              {copied ? (
                <Check color="#10b981" size={16} style={{ marginRight: 6 }} />
              ) : (
                <Copy color={theme.text} size={16} style={{ marginRight: 6 }} />
              )}
              <Text style={[styles.copyBtnText, { color: copied ? '#10b981' : theme.text }]}>
                {copied ? 'Copied Link' : 'Copy UPI Link'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.whatsappBtn, { backgroundColor: '#10b981' }]}
              onPress={handleShareWhatsApp}
            >
              <Share2 color="#ffffff" size={16} style={{ marginRight: 6 }} />
              <Text style={styles.whatsappBtnText}>Send on WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 4,
  },
  amountBadge: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 26,
    fontWeight: '900',
    marginVertical: 4,
    letterSpacing: -0.5,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  qrWrapper: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  scanHint: {
    fontSize: 12,
    marginTop: 12,
    marginBottom: 14,
    textAlign: 'center',
  },
  vpaRow: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  vpaLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  vpaValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  vpaInput: {
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 2,
    borderBottomWidth: 1,
  },
  vpaEditBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  vpaEditText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  copyBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  whatsappBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
