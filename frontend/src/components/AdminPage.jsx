import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import './AdminPage.css';

const TABS = [
  { id: 'plans', label: 'Planes' },
  { id: 'blocks', label: 'Bloques' },
  { id: 'exercises', label: 'Ejercicios' },
  { id: 'routines', label: 'Rutinas' },
  { id: 'users', label: 'Usuarios' },
];

export default function AdminPage() {
  const { user, token, loading } = useAuth();
  const [tab, setTab] = useState('plans');

  if (loading) {
    return <AdminShell>Cargando...</AdminShell>;
  }

  if (!user || user.role !== 'admin') {
    return (
      <AdminShell>
        <p>No tenés acceso a esta sección.</p>
        <a className="btn btn-primary" href="/">
          Volver al inicio
        </a>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <nav className="admin-tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={`admin-tabs__btn ${tab === t.id ? 'admin-tabs__btn--active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'plans' && <PlansTab token={token} />}
      {tab === 'blocks' && <BlocksTab token={token} />}
      {tab === 'exercises' && <ExercisesTab token={token} />}
      {tab === 'routines' && <RoutinesTab token={token} />}
      {tab === 'users' && <UsersTab token={token} />}
    </AdminShell>
  );
}

function AdminShell({ children }) {
  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <a href="/" className="admin-page__back">
          ← Volver al sitio
        </a>
        <h1>Administración — Glow &amp; Move</h1>
      </header>
      <div className="admin-page__body">{children}</div>
    </div>
  );
}

function useEntity(loader, deps = []) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  function reload() {
    setError('');
    loader().then(setItems).catch((err) => setError(err.message));
  }

  useEffect(reload, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { items, error, reload, setItems };
}

// ---------- Planes ----------

function PlansTab({ token }) {
  const { items, error, reload } = useEntity(() => api.admin.listPlans(token));
  const [saving, setSaving] = useState(null);
  const [savedId, setSavedId] = useState(null);

  if (error) return <p className="modal__error">{error}</p>;
  if (!items) return <p>Cargando...</p>;

  async function handleSave(plan, form) {
    setSaving(plan.id);
    setSavedId(null);
    try {
      await api.admin.updatePlan(
        plan.id,
        {
          name: form.name,
          priceUsd: Number(form.priceUsd),
          hasAds: form.hasAds,
          hasVideoAccess: form.hasVideoAccess,
          hasPersonalizedRoutine: form.hasPersonalizedRoutine,
          features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
        },
        token
      );
      setSavedId(plan.id);
      reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="admin-cards">
      {items.map((plan) => (
        <PlanCard key={plan.id} plan={plan} saving={saving === plan.id} saved={savedId === plan.id} onSave={handleSave} />
      ))}
    </div>
  );
}

function PlanCard({ plan, saving, saved, onSave }) {
  const [form, setForm] = useState({
    name: plan.name,
    priceUsd: plan.priceUsd,
    hasAds: plan.hasAds,
    hasVideoAccess: plan.hasVideoAccess,
    hasPersonalizedRoutine: plan.hasPersonalizedRoutine,
    features: plan.features.join('\n'),
  });

  return (
    <div className="admin-card">
      <div className="field">
        <label>Nombre</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="field">
        <label>Precio (USD)</label>
        <input type="number" step="0.01" value={form.priceUsd} onChange={(e) => setForm({ ...form, priceUsd: e.target.value })} />
      </div>
      <label className="admin-check">
        <input type="checkbox" checked={form.hasAds} onChange={(e) => setForm({ ...form, hasAds: e.target.checked })} />
        Tiene anuncios
      </label>
      <label className="admin-check">
        <input type="checkbox" checked={form.hasVideoAccess} onChange={(e) => setForm({ ...form, hasVideoAccess: e.target.checked })} />
        Acceso a videos y rutina por bloques
      </label>
      <label className="admin-check">
        <input
          type="checkbox"
          checked={form.hasPersonalizedRoutine}
          onChange={(e) => setForm({ ...form, hasPersonalizedRoutine: e.target.checked })}
        />
        Rutina personalizada
      </label>
      <div className="field">
        <label>Beneficios (uno por línea)</label>
        <textarea rows={4} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
      </div>
      <button type="button" className="btn btn-primary" disabled={saving} onClick={() => onSave(plan, form)}>
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
      {saved && <span className="admin-saved">Guardado ✓</span>}
    </div>
  );
}

// ---------- Bloques ----------

function BlocksTab({ token }) {
  const { items, error, reload } = useEntity(() => api.admin.listBlocks(token));
  const [saving, setSaving] = useState(null);
  const [savedId, setSavedId] = useState(null);

  if (error) return <p className="modal__error">{error}</p>;
  if (!items) return <p>Cargando...</p>;

  async function handleSave(block, form) {
    setSaving(block.id);
    setSavedId(null);
    try {
      await api.admin.updateBlock(block.id, { ...form, durationWeeks: Number(form.durationWeeks) }, token);
      setSavedId(block.id);
      reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="admin-cards">
      {items.map((block) => (
        <BlockCard key={block.id} block={block} saving={saving === block.id} saved={savedId === block.id} onSave={handleSave} />
      ))}
    </div>
  );
}

function BlockCard({ block, saving, saved, onSave }) {
  const [form, setForm] = useState({
    name: block.name,
    objective: block.objective,
    description: block.description || '',
    durationWeeks: block.durationWeeks,
  });

  return (
    <div className="admin-card">
      <div className="field">
        <label>Nombre</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="field">
        <label>Objetivo (se muestra al usuario)</label>
        <textarea rows={2} value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} />
      </div>
      <div className="field">
        <label>Descripción</label>
        <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="field">
        <label>Duración (semanas)</label>
        <input type="number" min="1" value={form.durationWeeks} onChange={(e) => setForm({ ...form, durationWeeks: e.target.value })} />
      </div>
      <button type="button" className="btn btn-primary" disabled={saving} onClick={() => onSave(block, form)}>
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
      {saved && <span className="admin-saved">Guardado ✓</span>}
    </div>
  );
}

// ---------- Ejercicios ----------

function ExercisesTab({ token }) {
  const { items, error, reload } = useEntity(() => api.admin.listVideos(token));
  const [form, setForm] = useState({ title: '', videoUrl: '', description: '', defaultSets: 4, defaultReps: 10, defaultWeight: 0 });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  if (error) return <p className="modal__error">{error}</p>;
  if (!items) return <p>Cargando...</p>;

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    if (!form.title || !form.videoUrl) {
      setFormError('Nombre y link de video son requeridos');
      return;
    }
    setCreating(true);
    try {
      await api.admin.createVideo(
        { ...form, defaultSets: Number(form.defaultSets), defaultReps: Number(form.defaultReps), defaultWeight: Number(form.defaultWeight) },
        token
      );
      setForm({ title: '', videoUrl: '', description: '', defaultSets: 4, defaultReps: 10, defaultWeight: 0 });
      reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este ejercicio del catálogo?')) return;
    try {
      await api.admin.deleteVideo(id, token);
      reload();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Video</th>
              <th>Series/Reps/Peso sugeridos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id}>
                <td>{v.title}</td>
                <td>
                  <a href={v.videoUrl} target="_blank" rel="noreferrer">
                    Ver
                  </a>
                </td>
                <td>
                  {v.defaultSets ?? '—'} × {v.defaultReps ?? '—'} × {v.defaultWeight ?? '0'}kg
                </td>
                <td>
                  <button type="button" className="admin-link-btn" onClick={() => handleDelete(v.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="admin-subtitle">Agregar ejercicio</h3>
      <form className="admin-form" onSubmit={handleCreate}>
        <div className="field">
          <label>Nombre</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="field">
          <label>Link de video</label>
          <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
        </div>
        <div className="field">
          <label>Descripción</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="admin-form__row">
          <div className="field">
            <label>Series por defecto</label>
            <input type="number" value={form.defaultSets} onChange={(e) => setForm({ ...form, defaultSets: e.target.value })} />
          </div>
          <div className="field">
            <label>Reps por defecto</label>
            <input type="number" value={form.defaultReps} onChange={(e) => setForm({ ...form, defaultReps: e.target.value })} />
          </div>
          <div className="field">
            <label>Peso por defecto (kg)</label>
            <input type="number" step="0.5" value={form.defaultWeight} onChange={(e) => setForm({ ...form, defaultWeight: e.target.value })} />
          </div>
        </div>
        {formError && <p className="modal__error">{formError}</p>}
        <button type="submit" className="btn btn-primary" disabled={creating}>
          {creating ? 'Creando...' : 'Crear ejercicio'}
        </button>
      </form>
    </div>
  );
}

// ---------- Rutinas ----------

function RoutinesTab({ token }) {
  const { items: blocks, error: blocksError } = useEntity(() => api.admin.listBlocks(token));
  const { items: videos } = useEntity(() => api.admin.listVideos(token));
  const [blockId, setBlockId] = useState(null);
  const { items: routines, error: routinesError, reload } = useEntity(() => (blockId ? api.admin.listRoutines(blockId, token) : Promise.resolve([])), [blockId]);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineUserId, setNewRoutineUserId] = useState('');

  if (blocksError) return <p className="modal__error">{blocksError}</p>;
  if (!blocks || !videos) return <p>Cargando...</p>;

  const activeBlockId = blockId || blocks[0]?.id;
  if (!blockId && blocks[0]) setBlockId(blocks[0].id);

  async function handleCreateRoutine() {
    if (!newRoutineName) return;
    try {
      await api.admin.createRoutine(
        { blockId: activeBlockId, userId: newRoutineUserId ? Number(newRoutineUserId) : null, name: newRoutineName },
        token
      );
      setNewRoutineName('');
      setNewRoutineUserId('');
      reload();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="field">
        <label>Bloque</label>
        <select value={activeBlockId || ''} onChange={(e) => setBlockId(Number(e.target.value))}>
          {blocks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {routinesError && <p className="modal__error">{routinesError}</p>}
      {routines &&
        routines.map((routine) => <RoutineCard key={routine.id} routine={routine} videos={videos} token={token} onChange={reload} />)}

      <h3 className="admin-subtitle">Nueva rutina en este bloque</h3>
      <div className="admin-form__row">
        <div className="field">
          <label>Nombre</label>
          <input value={newRoutineName} onChange={(e) => setNewRoutineName(e.target.value)} placeholder="Rutina base" />
        </div>
        <div className="field">
          <label>ID de usuario (vacío = genérica)</label>
          <input value={newRoutineUserId} onChange={(e) => setNewRoutineUserId(e.target.value)} placeholder="Ej: 12 — ver en Usuarios" />
        </div>
      </div>
      <button type="button" className="btn btn-primary" onClick={handleCreateRoutine}>
        Crear rutina
      </button>
    </div>
  );
}

function RoutineCard({ routine, videos, token, onChange }) {
  const [newDay, setNewDay] = useState('');

  async function handleDeleteRoutine() {
    if (!confirm(`¿Eliminar "${routine.name}" y todos sus días?`)) return;
    await api.admin.deleteRoutine(routine.id, token);
    onChange();
  }

  async function handleAddDay() {
    const dayNumber = Number(newDay);
    if (!dayNumber) return;
    await api.admin.createRoutineDay(routine.id, { dayNumber, sortOrder: dayNumber }, token);
    setNewDay('');
    onChange();
  }

  return (
    <div className="admin-card admin-card--routine">
      <div className="admin-card__header">
        <strong>
          {routine.name} {routine.userId ? `— personalizada (usuario #${routine.userId})` : '— genérica'}
        </strong>
        <button type="button" className="admin-link-btn" onClick={handleDeleteRoutine}>
          Eliminar rutina
        </button>
      </div>

      {routine.days.map((day) => (
        <RoutineDayRow key={day.id} day={day} videos={videos} token={token} onChange={onChange} />
      ))}

      <div className="admin-form__row admin-form__row--tight">
        <input type="number" min="1" placeholder="N° de día" value={newDay} onChange={(e) => setNewDay(e.target.value)} />
        <button type="button" className="btn" onClick={handleAddDay}>
          Agregar día
        </button>
      </div>
    </div>
  );
}

function RoutineDayRow({ day, videos, token, onChange }) {
  const [videoId, setVideoId] = useState(videos[0]?.id || '');
  const [sets, setSets] = useState(4);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [rest, setRest] = useState('');

  async function handleAddExercise() {
    if (!videoId) return;
    await api.admin.createRoutineExercise(
      day.id,
      {
        videoId: Number(videoId),
        order: day.exercises.length + 1,
        suggestedSets: Number(sets),
        suggestedReps: Number(reps),
        suggestedWeight: Number(weight),
        suggestedRest: rest,
      },
      token
    );
    onChange();
  }

  async function handleDeleteExercise(id) {
    await api.admin.deleteRoutineExercise(id, token);
    onChange();
  }

  async function handleDeleteDay() {
    if (!confirm(`¿Eliminar el Día ${day.dayNumber}?`)) return;
    await api.admin.deleteRoutineDay(day.id, token);
    onChange();
  }

  return (
    <div className="admin-day">
      <div className="admin-day__header">
        <span>Día {day.dayNumber}</span>
        <button type="button" className="admin-link-btn" onClick={handleDeleteDay}>
          Eliminar día
        </button>
      </div>
      <ul className="admin-day__exercises">
        {day.exercises.map((ex) => (
          <li key={ex.id}>
            {ex.video.title} — {ex.suggestedSets}×{ex.suggestedReps} × {Number(ex.suggestedWeight)}kg
            {ex.suggestedRest ? ` — descanso ${ex.suggestedRest}` : ''}
            <button type="button" className="admin-link-btn" onClick={() => handleDeleteExercise(ex.id)}>
              quitar
            </button>
          </li>
        ))}
      </ul>
      <div className="admin-form__row admin-form__row--tight">
        <select value={videoId} onChange={(e) => setVideoId(e.target.value)}>
          {videos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title}
            </option>
          ))}
        </select>
        <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} title="Series" />
        <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} title="Reps" />
        <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} title="Peso" />
        <input type="text" placeholder="Descanso, ej. 1:30" value={rest} onChange={(e) => setRest(e.target.value)} title="Descanso" />
        <button type="button" className="btn" onClick={handleAddExercise}>
          Agregar ejercicio
        </button>
      </div>
    </div>
  );
}

// ---------- Usuarios ----------

function UsersTab({ token }) {
  const { items, error, reload } = useEntity(() => api.admin.listUsers(token));

  if (error) return <p className="modal__error">{error}</p>;
  if (!items) return <p>Cargando...</p>;

  async function handleRoleChange(userItem, role) {
    await api.admin.updateUserRole(userItem.id, { role }, token);
    reload();
  }

  async function handleStatusChange(subscriptionId, status) {
    await api.admin.updateSubscriptionStatus(subscriptionId, { status }, token);
    reload();
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Plan</th>
            <th>Estado</th>
            <th>Rol</th>
          </tr>
        </thead>
        <tbody>
          {items.map((u) => {
            const sub = u.subscriptions?.[0];
            return (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>
                  {u.firstName} {u.lastName}
                </td>
                <td>{u.email}</td>
                <td>{sub?.plan?.name || '—'}</td>
                <td>
                  {sub ? (
                    <select value={sub.status} onChange={(e) => handleStatusChange(sub.id, e.target.value)}>
                      {['trial', 'pending_payment', 'active', 'past_due', 'canceled'].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <select value={u.role} onChange={(e) => handleRoleChange(u, e.target.value)}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
