import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';
import { trustGroupService } from '../services/trustGroupService';
import type { TrustContact } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TrustGroup'>;

const MAX_CONTACTS = 5;

// ─── Swipeable row ──────────────────────────────────────────────────────────
function SwipeRow({
  contact,
  onDelete,
}: {
  contact: TrustContact;
  onDelete: (id: number) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -80) {
          Animated.spring(translateX, { toValue: -90, useNativeDriver: true }).start();
          setSwiped(true);
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          setSwiped(false);
        }
      },
    }),
  ).current;

  const resetSwipe = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    setSwiped(false);
  };

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`¿Eliminar a ${contact.nombre} del grupo de confianza?`)) {
        onDelete(contact.id);
      } else {
        resetSwipe();
      }
    } else {
      Alert.alert(
        'Eliminar contacto',
        `¿Eliminar a ${contact.nombre} del grupo de confianza?`,
        [
          { text: 'Cancelar', style: 'cancel', onPress: resetSwipe },
          { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(contact.id) },
        ],
      );
    }
  };

  return (
    <View style={styles.swipeWrapper}>
      {/* Fondo rojo acción eliminar */}
      <View style={styles.deleteBackground}>
        <Ionicons name="trash-outline" size={22} color="#fff" />
        <Text style={styles.deleteLabel}>Eliminar</Text>
      </View>

      <Animated.View
        style={[styles.contactCard, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {/* Avatar inicial */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{contact.nombre.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{contact.nombre}</Text>
          <Text style={styles.contactEmail}>{contact.correo}</Text>
        </View>

        {/* Ícono de deslizar (hint) */}
        {!swiped && (
          <Ionicons name="chevron-back" size={16} color="#475569" style={styles.swipeHint} />
        )}

        {swiped && (
          <TouchableOpacity onPress={confirmDelete} style={styles.deleteInlineBtn}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function TrustGroupScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<TrustContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchContacts = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await trustGroupService.getContacts(user.id);
      setContacts(data);
    } catch {
      showAlert('Error', 'No se pudo cargar el grupo de confianza.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleAdd = async () => {
    const trimNombre = nombre.trim();
    const trimCorreo = correo.trim().toLowerCase();

    if (!trimNombre || !trimCorreo) {
      setErrorMsg('Nombre y correo son obligatorios.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimCorreo)) {
      setErrorMsg('Ingresa un correo válido.');
      return;
    }
    if (contacts.length >= MAX_CONTACTS) {
      setErrorMsg(`Límite de ${MAX_CONTACTS} contactos alcanzado.`);
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');
      const newContact = await trustGroupService.addContact(user!.id, trimNombre, trimCorreo);
      setContacts(prev => [...prev, newContact]);
      setNombre('');
      setCorreo('');
      setShowModal(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.mensaje ??
        'No se pudo agregar el contacto. Verifica que el correo no esté duplicado.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contactId: number) => {
    try {
      await trustGroupService.removeContact(user!.id, contactId);
      setContacts(prev => prev.filter(c => c.id !== contactId));
    } catch {
      showAlert('Error', 'No se pudo eliminar el contacto.');
    }
  };

  const canAdd = contacts.length < MAX_CONTACTS;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Grupo de Confianza</Text>
          <Text style={styles.subtitle}>
            {contacts.length}/{MAX_CONTACTS} contactos registrados
          </Text>
        </View>
        {canAdd && (
          <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
            <Ionicons name="person-add-outline" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Descripción */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color="#60a5fa" />
        <Text style={styles.infoText}>
          Cuando actives una alerta de emergencia, estos contactos recibirán una notificación por
          correo electrónico.
        </Text>
      </View>

      {/* Lista de contactos */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#3b82f6" size="large" />
          <Text style={styles.loadingText}>Cargando contactos...</Text>
        </View>
      ) : contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#1e3a5f" />
          <Text style={styles.emptyTitle}>Sin contactos aún</Text>
          <Text style={styles.emptySubtitle}>
            Agrega hasta 5 personas que recibirán alertas cuando actives el botón de pánico.
          </Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.emptyAddText}>Agregar primer contacto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.swipeTip}>
            <Ionicons name="hand-left-outline" size={13} /> Desliza a la izquierda para eliminar
          </Text>
          {contacts.map(c => (
            <SwipeRow key={c.id} contact={c} onDelete={handleDelete} />
          ))}

          {!canAdd && (
            <View style={styles.limitBanner}>
              <Ionicons name="lock-closed-outline" size={16} color="#f59e0b" />
              <Text style={styles.limitText}>
                Límite de {MAX_CONTACTS} contactos alcanzado
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal Agregar */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowModal(false);
          setErrorMsg('');
          setNombre('');
          setCorreo('');
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setShowModal(false);
            setErrorMsg('');
          }}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Nuevo contacto de confianza</Text>
            <Text style={styles.modalSubtitle}>
              Este contacto recibirá un correo al activar tu alerta de emergencia.
            </Text>

            {/* Campo Nombre */}
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: María López"
              placeholderTextColor="#475569"
              value={nombre}
              onChangeText={t => { setNombre(t); setErrorMsg(''); }}
              autoCapitalize="words"
              returnKeyType="next"
            />

            {/* Campo Correo */}
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: maria@email.com"
              placeholderTextColor="#475569"
              value={correo}
              onChangeText={t => { setCorreo(t); setErrorMsg(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />

            {/* Error */}
            {errorMsg !== '' && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Botones */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowModal(false);
                  setErrorMsg('');
                  setNombre('');
                  setCorreo('');
                }}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleAdd}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.saveText}>Agregar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    letterSpacing: 0.3,
  },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  addBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 10,
  },

  // ── Info
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    margin: 16,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  infoText: { flex: 1, color: '#93c5fd', fontSize: 13, lineHeight: 20 },

  // ── Lista
  list: { flex: 1 },
  listContent: { paddingBottom: 40 },
  swipeTip: { color: '#334155', fontSize: 11, textAlign: 'center', marginBottom: 8 },

  // ── Swipe row
  swipeWrapper: { position: 'relative', marginHorizontal: 16, marginBottom: 10 },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 90,
    backgroundColor: '#dc2626',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteLabel: { color: '#fff', fontSize: 11, fontWeight: '600' },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  contactInfo: { flex: 1 },
  contactName: { color: '#f1f5f9', fontSize: 15, fontWeight: '600' },
  contactEmail: { color: '#64748b', fontSize: 12, marginTop: 2 },
  swipeHint: { opacity: 0.6 },
  deleteInlineBtn: { padding: 8 },

  // ── Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyAddText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // ── Límite
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  limitText: { color: '#fbbf24', fontSize: 13 },

  // ── Loading
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: '#64748b', fontSize: 14 },

  // ── Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    marginBottom: 14,
  },
  errorText: { color: '#f87171', fontSize: 13, flex: 1 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelText: { color: '#94a3b8', fontWeight: '600', fontSize: 15 },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
