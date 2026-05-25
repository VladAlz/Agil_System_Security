import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  FileCheck,
  PlayCircle,
  StopCircle,
} from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import {
  CloseShiftReportPayload,
  reportService,
  ShiftReport,
} from '../services/reportService';

export default function ReportScreen({ navigation }: any) {
  const { guard } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeReport, setActiveReport] = useState<ShiftReport | null>(null);
  const [reports, setReports] = useState<ShiftReport[]>([]);

  const [observacionesInicio, setObservacionesInicio] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [alertasAtendidas, setAlertasAtendidas] = useState('');
  const [alertasResueltas, setAlertasResueltas] = useState('');
  const [tiempoPromedio, setTiempoPromedio] = useState('');

  const guardiaId = guard?.guardId;
  const nombreGuardia = guard?.nombre || 'Guardia';
  const zonaId = guard?.zonaId || 1;
  const nombreZona = guard?.zonaNombre || `Zona ${zonaId}`;

  const loadReports = useCallback(async () => {
    if (!guardiaId) {
      setLoading(false);
      return;
    }

    try {
      const data = await reportService.getReportsByGuard(guardiaId);
      setReports(data);

      const active =
        data.find((report) => report.estado?.toLowerCase() === 'activo') ??
        null;

      setActiveReport(active);
    } catch (error: any) {
      console.error('Error cargando reportes:', error);
      Alert.alert(
        'Error',
        error?.message || 'No se pudieron cargar los reportes del guardia.'
      );
    } finally {
      setLoading(false);
    }
  }, [guardiaId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleCreateReport = async () => {
    if (!guardiaId) {
      Alert.alert('Error', 'No se encontró el identificador del guardia.');
      return;
    }

    setSaving(true);

    try {
      const created = await reportService.createReport({
        guardiaId,
        nombreGuardia,
        zonaId,
        nombreZona,
        observaciones: observacionesInicio.trim(),
      });

      setActiveReport(created);
      setReports((prev) => [created, ...prev]);
      setObservacionesInicio('');

      Alert.alert('Turno abierto', 'El turno se abrió correctamente.');
    } catch (error: any) {
      console.error('Error creando reporte:', error);
      Alert.alert(
        'Error',
        error?.message || 'No se pudo abrir el turno del guardia.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCloseReport = async () => {
    if (!activeReport) {
      Alert.alert('Aviso', 'No existe un turno activo para cerrar.');
      return;
    }

    const atendidas = Number(alertasAtendidas);
    const resueltas = Number(alertasResueltas);
    const promedio = Number(tiempoPromedio);

    if (
      Number.isNaN(atendidas) ||
      Number.isNaN(resueltas) ||
      Number.isNaN(promedio)
    ) {
      Alert.alert('Validación', 'Los campos numéricos deben ser válidos.');
      return;
    }

    if (atendidas < 0 || resueltas < 0 || promedio < 0) {
      Alert.alert('Validación', 'Los valores no pueden ser negativos.');
      return;
    }

    if (resueltas > atendidas) {
      Alert.alert(
        'Validación',
        'Las alertas resueltas no pueden ser mayores que las atendidas.'
      );
      return;
    }

    if (!observacionesCierre.trim()) {
      Alert.alert('Validación', 'Ingresa una observación de cierre del turno.');
      return;
    }

    const payload: CloseShiftReportPayload = {
      alertasAtendidas: atendidas,
      alertasResueltas: resueltas,
      tiempoRespuestaPromedio: promedio,
      observaciones: observacionesCierre.trim(),
    };

    setSaving(true);

    try {
      const closed = await reportService.closeReport(activeReport.id, payload);

      setActiveReport(null);
      setReports((prev) =>
        prev.map((report) => (report.id === closed.id ? closed : report))
      );

      setAlertasAtendidas('');
      setAlertasResueltas('');
      setTiempoPromedio('');
      setObservacionesCierre('');

      Alert.alert('Turno cerrado', 'El reporte del turno fue enviado.');
    } catch (error: any) {
      console.error('Error cerrando reporte:', error);
      Alert.alert(
        'Error',
        error?.message || 'No se pudo cerrar el turno del guardia.'
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Sin registrar';

    return new Date(value).toLocaleString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator color="#ef4444" size="large" />
          <Text style={styles.loadingText}>Cargando reporte...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={26} color="#fff" />
            </TouchableOpacity>

            <View>
              <Text style={styles.title}>Reporte Diario</Text>
              <Text style={styles.subtitle}>Gestión del turno del guardia</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.iconBox}>
              <ClipboardList size={32} color="#ef4444" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>{nombreGuardia}</Text>
              <Text style={styles.summaryText}>{nombreZona}</Text>
              <Text style={styles.statusText}>
                Estado:{' '}
                <Text
                  style={
                    activeReport ? styles.statusActive : styles.statusClosed
                  }
                >
                  {activeReport ? 'Turno activo' : 'Sin turno activo'}
                </Text>
              </Text>
            </View>
          </View>

          {!activeReport ? (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <PlayCircle size={24} color="#22c55e" />
                <Text style={styles.sectionTitle}>Abrir turno</Text>
              </View>

              <Text style={styles.label}>Observaciones iniciales</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Ej: Inicio de turno sin novedades..."
                placeholderTextColor="#64748b"
                value={observacionesInicio}
                onChangeText={setObservacionesInicio}
                multiline
              />

              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.disabledButton]}
                onPress={handleCreateReport}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <PlayCircle size={22} color="#fff" />
                    <Text style={styles.primaryButtonText}>Abrir turno</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <StopCircle size={24} color="#a855f7" />
                <Text style={styles.sectionTitle}>Cerrar turno activo</Text>
              </View>

              <View style={styles.activeBox}>
                <Clock size={20} color="#bfdbfe" />
                <Text style={styles.activeText}>
                  Inicio: {formatDateTime(activeReport.inicioTurno)}
                </Text>
              </View>

              <Text style={styles.label}>Alertas atendidas</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 3"
                placeholderTextColor="#64748b"
                value={alertasAtendidas}
                onChangeText={setAlertasAtendidas}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Alertas resueltas</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 2"
                placeholderTextColor="#64748b"
                value={alertasResueltas}
                onChangeText={setAlertasResueltas}
                keyboardType="numeric"
              />

              <Text style={styles.label}>
                Tiempo promedio de respuesta en minutos
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 5"
                placeholderTextColor="#64748b"
                value={tiempoPromedio}
                onChangeText={setTiempoPromedio}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Observaciones finales</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Ej: Se atendieron las alertas del turno sin novedades adicionales..."
                placeholderTextColor="#64748b"
                value={observacionesCierre}
                onChangeText={setObservacionesCierre}
                multiline
              />

              <TouchableOpacity
                style={[styles.closeButton, saving && styles.disabledButton]}
                onPress={handleCloseReport}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <FileCheck size={22} color="#fff" />
                    <Text style={styles.primaryButtonText}>Enviar reporte</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Últimos turnos</Text>

            {reports.length === 0 ? (
              <Text style={styles.emptyText}>
                No existen reportes registrados.
              </Text>
            ) : (
              reports.slice(0, 5).map((report) => (
                <View key={report.id} style={styles.reportItem}>
                  <Text style={styles.reportTitle}>
                    Turno #{report.id} · {report.estado}
                  </Text>
                  <Text style={styles.reportText}>
                    Inicio: {formatDateTime(report.inicioTurno)}
                  </Text>
                  <Text style={styles.reportText}>
                    Fin: {formatDateTime(report.finTurno)}
                  </Text>
                  <Text style={styles.reportText}>
                    Atendidas: {report.alertasAtendidas} · Resueltas:{' '}
                    {report.alertasResueltas}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    padding: 26,
    paddingBottom: 46,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginBottom: 28,
  },
  backButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: '#94a3b8',
    marginTop: 4,
    fontSize: 15,
  },
  summaryCard: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  summaryText: {
    color: '#cbd5e1',
    marginTop: 4,
    fontWeight: '700',
  },
  statusText: {
    color: '#94a3b8',
    marginTop: 8,
    fontWeight: '700',
  },
  statusActive: {
    color: '#22c55e',
  },
  statusClosed: {
    color: '#f97316',
  },
  card: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  label: {
    color: '#cbd5e1',
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 14,
    color: '#fff',
    fontWeight: '700',
  },
  textArea: {
    minHeight: 110,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 14,
    color: '#fff',
    fontWeight: '700',
    textAlignVertical: 'top',
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: '#22c55e',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  closeButton: {
    marginTop: 18,
    backgroundColor: '#a855f7',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  activeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#172554',
    borderWidth: 1,
    borderColor: '#2563eb',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  activeText: {
    color: '#bfdbfe',
    fontWeight: '800',
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '700',
  },
  reportItem: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
  },
  reportTitle: {
    color: '#fff',
    fontWeight: '900',
    marginBottom: 6,
  },
  reportText: {
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 2,
  },
});