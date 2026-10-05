import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandWordmark } from '@/components/brand-header';
import { LeafletMap } from '@/components/map/leaflet-map';
import { PlaceField } from '@/components/map/place-field';
import { PlaceSuggestions } from '@/components/map/place-suggestions';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { usePlaceSearch } from '@/hooks/use-place-search';
import { useAppTheme } from '@/providers/theme-provider';
import { reverseGeocode, searchPlaces, type GeoPlace, type LatLng } from '@/services/geocoding';
import { ApiError } from '@/services/http';
import { atualizarTrajeto, buscarTrajeto, criarTrajeto } from '@/services/trajetos';
import type { TrajetoResponse } from '@/types/api';

type FieldKind = 'origem' | 'destino';

type Endpoint = {
  text: string;
  place: GeoPlace | null;
};

const EMPTY_ENDPOINT: Endpoint = { text: '', place: null };

export default function MapaScreen() {
  const { scheme, colors } = useAppTheme();
  const { trajetoId } = useLocalSearchParams<{ trajetoId?: string }>();
  const isEditing = Boolean(trajetoId);

  const [origem, setOrigem] = useState<Endpoint>(EMPTY_ENDPOINT);
  const [destino, setDestino] = useState<Endpoint>(EMPTY_ENDPOINT);
  const [activeField, setActiveField] = useState<FieldKind | null>(null);
  const [resolving, setResolving] = useState<FieldKind | null>(null);
  const [loadingTrajeto, setLoadingTrajeto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<TrajetoResponse | null>(null);

  const activeEndpoint = activeField === 'origem' ? origem : activeField === 'destino' ? destino : null;
  const searchQuery = activeEndpoint && !activeEndpoint.place ? activeEndpoint.text : null;
  const search = usePlaceSearch(searchQuery, activeField);
  const showSuggestions = search.enabled;

  const setEndpoint = (kind: FieldKind, value: Endpoint) =>
    kind === 'origem' ? setOrigem(value) : setDestino(value);

  useEffect(() => {
    if (!trajetoId) return;
    let cancelled = false;

    async function loadTrajeto(id: string) {
      setLoadingTrajeto(true);
      setError(null);
      setSaved(null);
      try {
        const trajeto = await buscarTrajeto(id);
        if (cancelled) return;
        setOrigem({ text: trajeto.origem, place: null });
        setDestino({ text: trajeto.destino, place: null });

        const [origemPlace] = await searchPlaces(trajeto.origem).catch(() => []);
        if (cancelled) return;
        if (origemPlace) setOrigem({ text: trajeto.origem, place: origemPlace });

        const [destinoPlace] = await searchPlaces(trajeto.destino).catch(() => []);
        if (cancelled) return;
        if (destinoPlace) setDestino({ text: trajeto.destino, place: destinoPlace });
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof ApiError ? reason.message : 'Não foi possível carregar o trajeto.');
        }
      } finally {
        if (!cancelled) setLoadingTrajeto(false);
      }
    }

    loadTrajeto(trajetoId);
    return () => {
      cancelled = true;
    };
  }, [trajetoId]);

  function resetForm() {
    setOrigem(EMPTY_ENDPOINT);
    setDestino(EMPTY_ENDPOINT);
    setActiveField(null);
    setError(null);
    setSaved(null);
  }

  function exitEditMode() {
    resetForm();
    router.setParams({ trajetoId: undefined });
  }

  function handleChangeText(kind: FieldKind, text: string) {
    setEndpoint(kind, { text, place: null });
    setSaved(null);
  }

  function handleSelectPlace(place: GeoPlace) {
    if (!activeField) return;
    setEndpoint(activeField, { text: place.label, place });
    setActiveField(null);
    Keyboard.dismiss();
  }

  async function resolvePoint(kind: FieldKind, point: LatLng) {
    setResolving(kind);
    setEndpoint(kind, {
      text: 'Buscando endereço…',
      place: { ...point, label: '', secondary: '' },
    });
    try {
      const place = await reverseGeocode(point);
      setEndpoint(kind, { text: place.label, place });
    } catch {
      const label = `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
      setEndpoint(kind, { text: label, place: { ...point, label, secondary: '' } });
    } finally {
      setResolving(null);
    }
  }

  function handleMapPress(point: LatLng) {
    const target: FieldKind = activeField ?? (origem.place ? 'destino' : 'origem');
    Keyboard.dismiss();
    setActiveField(null);
    setSaved(null);
    resolvePoint(target, point);
  }

  async function handleUseMyLocation() {
    setError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Permita o acesso à localização para usar sua posição como origem.');
      return;
    }
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setActiveField(null);
      await resolvePoint('origem', position.coords);
    } catch {
      setError('Não foi possível obter sua localização agora.');
    }
  }

  function handleSwap() {
    setOrigem(destino);
    setDestino(origem);
    setSaved(null);
  }

  async function handleSave() {
    const body = { origem: origem.text.trim(), destino: destino.text.trim() };
    if (!body.origem || !body.destino) {
      setError('Informe de onde você sai e para onde vai.');
      return;
    }

    Keyboard.dismiss();
    setActiveField(null);
    setSaving(true);
    setError(null);
    try {
      if (trajetoId) {
        await atualizarTrajeto(trajetoId, body);
        resetForm();
        router.setParams({ trajetoId: undefined });
        router.navigate('/trajetos');
      } else {
        setSaved(await criarTrajeto(body));
      }
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Não foi possível salvar o trajeto.');
    } finally {
      setSaving(false);
    }
  }

  const canSave = Boolean(origem.text.trim() && destino.text.trim()) && !resolving && !loadingTrajeto;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.mapArea}>
        <LeafletMap
          scheme={scheme}
          origin={origem.place}
          destination={destino.place}
          colors={{
            origin: colors.accent,
            destination: colors.primary,
            line: colors.primaryText,
            markerBorder: colors.background,
          }}
          onPress={handleMapPress}
        />
        <SafeAreaView edges={['top']} style={styles.topBar}>
          <View
            style={[
              styles.brandChip,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}>
            <Image
              source={require('@/assets/essarota/essarota-logo-sem-fundo.png')}
              style={styles.brandLogo}
              contentFit="contain"
            />
            <BrandWordmark size={18} />
          </View>
          <ThemeToggle />
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={[
            styles.panel,
            { backgroundColor: colors.background, borderColor: colors.border, boxShadow: `0 -8px 24px ${colors.shadow}22` },
          ]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.panelContent}>
            <View style={styles.panelHeader}>
              <ThemedText type="heading">{isEditing ? 'Editar trajeto' : 'Para onde vamos?'}</ThemedText>
              {isEditing && (
                <IconButton icon="close" size={34} accessibilityLabel="Cancelar edição" onPress={exitEditMode} />
              )}
            </View>

            <View style={styles.fieldsRow}>
              <View style={styles.fields}>
                <PlaceField
                  kind="origem"
                  value={origem.text}
                  placeholder="De onde você sai?"
                  active={activeField === 'origem'}
                  loading={resolving === 'origem' || (activeField === 'origem' && search.loading)}
                  onChangeText={(text) => handleChangeText('origem', text)}
                  onFocus={() => setActiveField('origem')}
                  onClear={() => setOrigem(EMPTY_ENDPOINT)}
                />
                <PlaceField
                  kind="destino"
                  value={destino.text}
                  placeholder="Para onde você vai?"
                  active={activeField === 'destino'}
                  loading={resolving === 'destino' || (activeField === 'destino' && search.loading)}
                  onChangeText={(text) => handleChangeText('destino', text)}
                  onFocus={() => setActiveField('destino')}
                  onClear={() => setDestino(EMPTY_ENDPOINT)}
                />
              </View>
              <IconButton icon="swap" accessibilityLabel="Inverter origem e destino" onPress={handleSwap} />
            </View>

            {showSuggestions ? (
              <PlaceSuggestions
                results={search.results}
                loading={search.loading}
                error={search.error}
                onSelect={handleSelectPlace}
              />
            ) : (
              <View style={styles.helperRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleUseMyLocation}
                  style={({ pressed }) => [
                    styles.locationChip,
                    { backgroundColor: colors.accentSoft },
                    pressed && styles.pressed,
                  ]}>
                  <Icon name="myLocation" size={16} color={colors.accentText} />
                  <ThemedText type="smallBold" themeColor="accentText">
                    Minha localização
                  </ThemedText>
                </Pressable>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.helperText}>
                  ou toque no mapa para marcar {activeField === 'destino' || origem.place ? 'o destino' : 'a origem'}
                </ThemedText>
              </View>
            )}

            <FormError message={error} />

            {saved ? (
              <Card style={{ backgroundColor: colors.accentSoft, borderColor: colors.accent }}>
                <View style={styles.savedHeader}>
                  <Icon name="clock" size={20} color={colors.accentText} />
                  <ThemedText type="heading">
                    Trajeto salvo · ~{saved.tempoEstimadoMinutos} min
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  Em breve você verá aqui as linhas de trem e ônibus do percurso e receberá alertas delas.
                </ThemedText>
                <View style={styles.savedActions}>
                  <Button
                    title="Ver meus trajetos"
                    variant="ghost"
                    style={styles.flex}
                    onPress={() => router.navigate('/trajetos')}
                  />
                  <Button title="Novo trajeto" style={styles.flex} onPress={resetForm} />
                </View>
              </Card>
            ) : (
              <Button
                title={isEditing ? 'Salvar alterações' : 'Salvar trajeto'}
                icon="route"
                onPress={handleSave}
                loading={saving || loadingTrajeto}
                disabled={!canSave}
              />
            )}

            <View style={styles.footnote}>
              <Icon name="train" size={14} color={colors.textSecondary} />
              <ThemedText type="caption" themeColor="textSecondary">
                Rotas com linhas de trem e ônibus em breve.
              </ThemedText>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  mapArea: {
    flex: 1,
    minHeight: 200,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    pointerEvents: 'box-none',
  },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingLeft: Spacing.one,
    paddingRight: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  brandLogo: {
    width: 44,
    height: 28,
  },
  panel: {
    marginTop: -Radius.xl,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: 520,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: Spacing.two,
  },
  panelContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 34,
  },
  fieldsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  fields: {
    flex: 1,
    gap: Spacing.two,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  helperText: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.75,
  },
  savedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  savedActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  footnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
});
