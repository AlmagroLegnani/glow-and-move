import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import AccountShell from './AccountShell.jsx';
import './Modal.css';
import './BlocksModal.css';

export default function MiRutinaPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | locked | error | ready
  const [data, setData] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const [performedChoice, setPerformedChoice] = useState(null); // null | true | false
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    api
      .myBlocks(token)
      .then((res) => {
        if (cancelled) return;
        if (res.locked) setStatus('locked');
        else {
          setData(res);
          setStatus('ready');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setFetchError(err.message);
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // cada vez que cambia el día/semana/bloque actual, arrancamos de cero el formulario
  useEffect(() => {
    setPerformedChoice(null);
    setDrafts({});
  }, [data?.today?.blockNumber, data?.today?.week, data?.today?.dayNumber]);

  async function submitDay(performed, exercisesPayload) {
    setBusy(true);
    setActionError('');
    try {
      const res = await api.logDay(performed ? { performed, exercises: exercisesPayload } : { performed }, token);
      setData(res);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleChoosePerformed(value) {
    setActionError('');
    setPerformedChoice(value);
    if (value === false) {
      submitDay(false, []);
      return;
    }
    const initial = {};
    data.today.exercises.forEach((ex) => {
      initial[ex.videoId] = {
        sets: String(ex.suggestedSets),
        reps: String(ex.suggestedReps),
        weight: String(ex.suggestedWeight),
        rest: ex.suggestedRest || '',
      };
    });
    setDrafts(initial);
  }

  function updateDraft(videoId, field, value) {
    setDrafts((prev) => ({ ...prev, [videoId]: { ...prev[videoId], [field]: value } }));
  }

  function handleSaveDay() {
    const exercisesPayload = data.today.exercises.map((ex) => ({
      videoId: ex.videoId,
      actualSets: Number(drafts[ex.videoId]?.sets),
      actualReps: Number(drafts[ex.videoId]?.reps),
      actualWeight: Number(drafts[ex.videoId]?.weight),
      actualRest: drafts[ex.videoId]?.rest || '',
    }));
    const invalid = exercisesPayload.some(
      (e) =>
        !Number.isFinite(e.actualSets) ||
        e.actualSets <= 0 ||
        !Number.isFinite(e.actualReps) ||
        e.actualReps <= 0 ||
        !Number.isFinite(e.actualWeight) ||
        e.actualWeight < 0
    );
    if (invalid) {
      setActionError('Completá series, repeticiones y peso reales de todos los ejercicios antes de guardar.');
      return;
    }
    submitDay(true, exercisesPayload);
  }

  if (authLoading || status === 'loading') {
    return (
      <AccountShell active="rutina">
        <h1>Mi rutina</h1>
        <p className="profile__videos-hint">Cargando...</p>
      </AccountShell>
    );
  }

  if (!user) {
    return (
      <AccountShell active="rutina">
        <h1>Mi rutina</h1>
        <p className="profile__videos-hint">Iniciá sesión para ver tu rutina.</p>
        <a className="btn btn-primary" href="/">
          Volver al inicio
        </a>
      </AccountShell>
    );
  }

  if (status === 'locked') {
    return (
      <AccountShell active="rutina">
        <h1>Mi rutina</h1>
        <p className="profile__videos-hint">
          La rutina por bloques está disponible a partir del plan Premium. <a href="/#planes">Ver planes</a>.
        </p>
      </AccountShell>
    );
  }

  if (status === 'error') {
    return (
      <AccountShell active="rutina">
        <h1>Mi rutina</h1>
        <p className="modal__error">{fetchError}</p>
      </AccountShell>
    );
  }

  const { today } = data;

  if (today.state !== 'active') {
    const MESSAGE = {
      year_complete: '¡Completaste los 4 bloques de este año! Andá a "Mi bitácora" para ver tu resumen y arrancar el próximo año.',
      awaiting_payment: 'Terminaste tu bloque actual. Andá a "Mi bitácora" para pagar y seguir con el siguiente.',
      no_routine: 'Este bloque todavía no tiene una rutina cargada. Escribinos y lo resolvemos.',
    };
    return (
      <AccountShell active="rutina">
        <h1>Mi rutina</h1>
        <p className="profile__videos-hint">
          {MESSAGE[today.state] || 'No hay un entrenamiento activo en este momento.'}{' '}
          {today.state !== 'no_routine' && <a href="/mi-bitacora">Ir a Mi bitácora</a>}
        </p>
      </AccountShell>
    );
  }

  return (
    <AccountShell active="rutina">
      <h1>Mi rutina</h1>

      {actionError && <p className="modal__error">{actionError}</p>}

      <div className="bl-today">
        <p className="bl-today__eyebrow">
          Bloque {today.blockNumber} · Semana {today.week} de {today.totalWeeks}
        </p>
        <h3 className="bl-today__day">
          Día {today.dayNumber} de {today.totalDays} — {today.routineName}
          {today.personalized && <span className="bl-today__badge">Personalizada</span>}
        </h3>
      </div>

      <div className="bl-table-wrap">
        <table className="bl-table">
          <thead>
            <tr>
              <th>Ejercicio</th>
              <th>Ver ejercicio</th>
              <th>Series recomendadas</th>
              <th>Repeticiones recomendadas</th>
              <th>Kilos recomendados</th>
              <th>Descanso recomendado</th>
              {performedChoice === true && (
                <>
                  <th>Tus series</th>
                  <th>Tus repeticiones</th>
                  <th>Tus kilos</th>
                  <th>Tu descanso</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {today.exercises.map((ex) => (
              <tr key={ex.videoId}>
                <td>{ex.name}</td>
                <td>
                  <a href={ex.videoUrl} target="_blank" rel="noreferrer">
                    ▶ Ver ejercicio
                  </a>
                </td>
                <td>{ex.suggestedSets}</td>
                <td>{ex.suggestedReps}</td>
                <td>{ex.suggestedWeight > 0 ? `${ex.suggestedWeight}kg` : 'Peso corporal'}</td>
                <td>{ex.suggestedRest || '—'}</td>
                {performedChoice === true && (
                  <>
                    <td>
                      <input
                        type="number"
                        min="1"
                        placeholder="series"
                        value={drafts[ex.videoId]?.sets ?? ''}
                        disabled={busy}
                        onChange={(e) => updateDraft(ex.videoId, 'sets', e.target.value)}
                        aria-label={`Series reales de ${ex.name}`}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        placeholder="reps"
                        value={drafts[ex.videoId]?.reps ?? ''}
                        disabled={busy}
                        onChange={(e) => updateDraft(ex.videoId, 'reps', e.target.value)}
                        aria-label={`Repeticiones reales de ${ex.name}`}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="kg"
                        value={drafts[ex.videoId]?.weight ?? ''}
                        disabled={busy}
                        onChange={(e) => updateDraft(ex.videoId, 'weight', e.target.value)}
                        aria-label={`Peso real de ${ex.name}`}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="ej. 1:30"
                        value={drafts[ex.videoId]?.rest ?? ''}
                        disabled={busy}
                        onChange={(e) => updateDraft(ex.videoId, 'rest', e.target.value)}
                        aria-label={`Descanso real de ${ex.name}`}
                      />
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {performedChoice === null && (
        <div className="bl-ask">
          <p>¿Realizaste este entrenamiento?</p>
          <div className="bl-ask__buttons">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => handleChoosePerformed(true)}>
              Sí, lo hice
            </button>
            <button type="button" className="btn" disabled={busy} onClick={() => handleChoosePerformed(false)}>
              No lo hice
            </button>
          </div>
        </div>
      )}

      {performedChoice === true && (
        <div className="bl-ask">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={handleSaveDay}>
            Guardar en mi bitácora
          </button>
          <button type="button" className="bl-ask__cancel" disabled={busy} onClick={() => setPerformedChoice(null)}>
            Cancelar
          </button>
        </div>
      )}

      <p className="profile__videos-hint">
        Lo que guardés acá queda en tu <a href="/mi-bitacora">bitácora</a> para comparar semana a semana.
      </p>
    </AccountShell>
  );
}
