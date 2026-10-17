import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import AccountTopbar from './AccountTopbar.jsx';
import AdminDropdown from './AdminDropdown.jsx';
import './AdminPage.css';

const TABS = [
  { id: 'plans', label: 'Planes' },
  { id: 'blocks', label: 'Bloques' },
  { id: 'exercises', label: 'Ejercicios' },
  { id: 'routines', label: 'Rutinas' },
  { id: 'users', label: 'Usuarios' },
];

// Permite entrar directo a una sección desde "Mi perfil" (ej. /admin?tab=users).
function initialTab() {
  const fromUrl = new URLSearchParams(window.location.search).get('tab');
  return TABS.some((t) => t.id === fromUrl) ? fromUrl : 'plans';
}

const PING_INTERVAL_MS = 60 * 1000; // mantiene el lock vivo mientras el panel sigue abierto

export default function AdminPage() {
  const { user, token, loading } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [lockState, setLockState] = useState('checking'); // checking | ok | locked
  const [lockMessage, setLockMessage] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin' || !token) return undefined;
    let cancelled = false;

    function ping() {
      api.admin
        .ping(token)
        .then(() => {
          if (!cancelled) setLockState('ok');
        })
        .catch((err) => {
          if (!cancelled) {
            setLockState('locked');
            setLockMessage(err.message);
          }
        });
    }

    ping();
    const interval = setInterval(ping, PING_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, token]);

  if (loading) {
    return (
      <AdminShell>
        <div className="admin-page__content">
          <p className="profile__videos-hint">Cargando...</p>
        </div>
      </AdminShell>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <AdminShell>
        <div className="admin-page__content">
          <p className="profile__videos-hint">No tenés acceso a esta sección.</p>
          <a className="btn btn-primary" href="/" style={{ alignSelf: 'flex-start' }}>
            Volver al inicio
          </a>
        </div>
      </AdminShell>
    );
  }

  if (lockState === 'checking') {
    return (
      <AdminShell>
        <div className="admin-page__content">
          <p className="profile__videos-hint">Cargando...</p>
        </div>
      </AdminShell>
    );
  }

  if (lockState === 'locked') {
    return (
      <AdminShell>
        <div className="admin-page__content">
          <p className="modal__error">{lockMessage}</p>
          <p className="profile__videos-hint">Solo un admin puede usar el panel a la vez, para que dos personas no editen lo mismo al mismo tiempo.</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <nav className="admin-tabs" aria-label="Secciones de administración">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`admin-tabs__btn ${tab === t.id ? 'admin-tabs__btn--active' : ''}`}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => {
              setTab(t.id);
              window.history.replaceState(null, '', `/admin?tab=${t.id}`);
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="ad-panel">
        {tab === 'plans' && <PlansTab token={token} />}
        {tab === 'blocks' && <BlocksTab token={token} />}
        {tab === 'exercises' && <ExercisesTab token={token} />}
        {tab === 'routines' && <RoutinesTab token={token} />}
        {tab === 'users' && <UsersTab token={token} />}
      </div>
    </AdminShell>
  );
}

function AdminShell({ children }) {
  return (
    <div className="admin-page">
      <AccountTopbar active="admin" wide />
      <div className="container admin-page__inner">
        <header className="admin-page__header">
          <span className="admin-page__eyebrow">Panel de control</span>
          <h1 className="admin-page__title">Administración</h1>
          <p className="admin-page__lede">Planes, bloques, ejercicios, rutinas y usuarios de Glow &amp; Move.</p>
        </header>
        {children}
      </div>
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

// ---------- Piezas compartidas ----------

function SectionHeader({ title, description, count, action }) {
  return (
    <div className="ad-section-head">
      <div>
        <h2>
          {title}
          {count !== undefined && <span className="ad-count">{count}</span>}
        </h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function Switch({ checked, onChange, label, hint }) {
  return (
    <label className="ad-switch">
      <span className="ad-switch__text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="ad-switch__track" aria-hidden="true">
        <span className="ad-switch__thumb" />
      </span>
    </label>
  );
}

// Pie de las tarjetas editables: el botón se habilita sólo si hay cambios sin guardar.
function SaveFooter({ dirty, saving, saved, onSave }) {
  return (
    <div className="ad-card__footer">
      <span className={`ad-status ${saved && !dirty ? 'ad-status--saved' : dirty ? 'ad-status--dirty' : ''}`}>
        {saved && !dirty ? 'Cambios guardados' : dirty ? 'Cambios sin guardar' : 'Sin cambios'}
      </span>
      <button type="button" className="ad-btn ad-btn--primary" disabled={!dirty || saving} onClick={onSave}>
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  );
}

function Icon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
  plus: 'M12 5v14M5 12h14',
  x: 'M6 6l12 12M18 6 6 18',
  play: 'M8 5.5v13l11-6.5z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
};

function isDirty(form, initial) {
  return JSON.stringify(form) !== JSON.stringify(initial);
}

function Loading() {
  return <p className="profile__videos-hint">Cargando...</p>;
}

// ---------- Planes ----------

function PlansTab({ token }) {
  const { items, error, reload } = useEntity(() => api.admin.listPlans(token));
  const [saving, setSaving] = useState(null);
  const [savedId, setSavedId] = useState(null);

  if (error) return <p className="modal__error">{error}</p>;
  if (!items) return <Loading />;

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
    <>
      <SectionHeader
        title="Planes"
        count={items.length}
        description="Precio mensual y beneficios de cada experiencia. Los descuentos trimestral/semestral/anual se calculan solos."
      />
      <div className="ad-grid">
        {items.map((plan) => (
          <PlanCard key={plan.id} plan={plan} saving={saving === plan.id} saved={savedId === plan.id} onSave={handleSave} />
        ))}
      </div>
    </>
  );
}

function planForm(plan) {
  return {
    name: plan.name,
    priceUsd: String(plan.priceUsd),
    hasAds: plan.hasAds,
    hasVideoAccess: plan.hasVideoAccess,
    hasPersonalizedRoutine: plan.hasPersonalizedRoutine,
    features: plan.features.join('\n'),
  };
}

function PlanCard({ plan, saving, saved, onSave }) {
  const [initial, setInitial] = useState(() => planForm(plan));
  const [form, setForm] = useState(initial);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    const next = planForm(plan);
    setInitial(next);
    setForm(next);
  }, [plan]);

  return (
    <article className="ad-card">
      <div className="ad-card__head">
        <span className="ad-tag">{plan.slug}</span>
        {plan.slug === 'full' && <span className="ad-tag ad-tag--accent">Destacado</span>}
      </div>

      <input className="ad-title-input" value={form.name} onChange={(e) => set({ name: e.target.value })} aria-label="Nombre del plan" />

      <div className="ad-field">
        <label>Precio mensual</label>
        <div className="ad-affix">
          <span>U$S</span>
          <input type="number" step="0.01" min="0" value={form.priceUsd} onChange={(e) => set({ priceUsd: e.target.value })} />
          <span>/ mes</span>
        </div>
      </div>

      <div className="ad-switches">
        <Switch label="Anuncios" hint="Muestra publicidad" checked={form.hasAds} onChange={(v) => set({ hasAds: v })} />
        <Switch label="Videos" hint="Acceso a los videos de ejercicios" checked={form.hasVideoAccess} onChange={(v) => set({ hasVideoAccess: v })} />
        <Switch
          label="Rutina personalizada"
          hint="El entrenador arma su rutina"
          checked={form.hasPersonalizedRoutine}
          onChange={(v) => set({ hasPersonalizedRoutine: v })}
        />
      </div>

      <div className="ad-field">
        <label>Beneficios</label>
        <textarea rows={4} value={form.features} onChange={(e) => set({ features: e.target.value })} />
        <small>Uno por línea. Se muestran en la tarjeta del plan.</small>
      </div>

      <SaveFooter dirty={isDirty(form, initial)} saving={saving} saved={saved} onSave={() => onSave(plan, form)} />
    </article>
  );
}

// ---------- Bloques ----------

function BlocksTab({ token }) {
  const { items, error, reload } = useEntity(() => api.admin.listBlocks(token));
  const [saving, setSaving] = useState(null);
  const [savedId, setSavedId] = useState(null);

  if (error) return <p className="modal__error">{error}</p>;
  if (!items) return <Loading />;

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
    <>
      <SectionHeader
        title="Bloques del programa"
        count={items.length}
        description="Las etapas del año. El objetivo es lo que ve el usuario en Mi rutina y Mi bitácora."
      />
      <div className="ad-stack">
        {items.map((block) => (
          <BlockCard key={block.id} block={block} saving={saving === block.id} saved={savedId === block.id} onSave={handleSave} />
        ))}
      </div>
    </>
  );
}

function blockForm(block) {
  return {
    name: block.name,
    objective: block.objective,
    description: block.description || '',
    durationWeeks: String(block.durationWeeks),
  };
}

function BlockCard({ block, saving, saved, onSave }) {
  const [initial, setInitial] = useState(() => blockForm(block));
  const [form, setForm] = useState(initial);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    const next = blockForm(block);
    setInitial(next);
    setForm(next);
  }, [block]);

  return (
    <article className="ad-card ad-card--row">
      <span className="ad-number" aria-hidden="true">
        {String(block.number).padStart(2, '0')}
      </span>
      <div className="ad-card__body">
        <div className="ad-row">
          <div className="ad-field ad-field--grow">
            <label>Nombre</label>
            <input value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div className="ad-field ad-field--narrow">
            <label>Duración</label>
            <div className="ad-affix">
              <input type="number" min="1" value={form.durationWeeks} onChange={(e) => set({ durationWeeks: e.target.value })} />
              <span>semanas</span>
            </div>
          </div>
        </div>
        <div className="ad-row">
          <div className="ad-field ad-field--grow">
            <label>
              Objetivo <span className="ad-label-hint">visible para el usuario</span>
            </label>
            <textarea rows={2} value={form.objective} onChange={(e) => set({ objective: e.target.value })} />
          </div>
          <div className="ad-field ad-field--grow">
            <label>
              Descripción <span className="ad-label-hint">interna</span>
            </label>
            <textarea rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} />
          </div>
        </div>
        <SaveFooter dirty={isDirty(form, initial)} saving={saving} saved={saved} onSave={() => onSave(block, form)} />
      </div>
    </article>
  );
}

// ---------- Ejercicios ----------

const LEVELS = [
  { id: 'principiante', label: 'Principiante', tone: 'green' },
  { id: 'intermedio', label: 'Intermedio', tone: 'beige' },
  { id: 'experto', label: 'Experto', tone: 'dark' },
];

const EMPTY_EXERCISE = { title: '', videoUrl: '', description: '', defaultSets: 4, defaultReps: 10, defaultWeight: 0, level: 'principiante' };

function ExercisesTab({ token }) {
  const { items, error, reload } = useEntity(() => api.admin.listVideos(token));
  const [form, setForm] = useState(EMPTY_EXERCISE);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  if (error) return <p className="modal__error">{error}</p>;
  if (!items) return <Loading />;

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
      setForm(EMPTY_EXERCISE);
      setShowForm(false);
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

  async function handleLevelChange(id, level) {
    try {
      await api.admin.updateVideo(id, { level }, token);
      reload();
    } catch (err) {
      alert(err.message);
    }
  }

  const q = query.trim().toLowerCase();
  const filtered = items.filter((v) => (levelFilter === 'all' || v.level === levelFilter) && (!q || v.title.toLowerCase().includes(q)));

  return (
    <>
      <SectionHeader
        title="Ejercicios"
        count={items.length}
        description="Catálogo que usan las rutinas y la sección Mis videos."
        action={
          <button type="button" className="ad-btn ad-btn--primary" onClick={() => setShowForm((v) => !v)}>
            <Icon d={showForm ? ICONS.x : ICONS.plus} />
            {showForm ? 'Cerrar' : 'Nuevo ejercicio'}
          </button>
        }
      />

      {showForm && (
        <form className="ad-card ad-card--form" onSubmit={handleCreate}>
          <h3 className="ad-card__title">Nuevo ejercicio</h3>
          <div className="ad-row">
            <div className="ad-field ad-field--grow">
              <label>Nombre</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Sentadilla búlgara" />
            </div>
            <div className="ad-field ad-field--grow">
              <label>Link de video</label>
              <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/..." />
            </div>
          </div>
          <div className="ad-field">
            <label>Descripción</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tips de técnica (opcional)" />
          </div>
          <div className="ad-row">
            <div className="ad-field">
              <label>Series</label>
              <input type="number" value={form.defaultSets} onChange={(e) => setForm({ ...form, defaultSets: e.target.value })} />
            </div>
            <div className="ad-field">
              <label>Reps</label>
              <input type="number" value={form.defaultReps} onChange={(e) => setForm({ ...form, defaultReps: e.target.value })} />
            </div>
            <div className="ad-field">
              <label>Peso (kg)</label>
              <input type="number" step="0.5" value={form.defaultWeight} onChange={(e) => setForm({ ...form, defaultWeight: e.target.value })} />
            </div>
            <div className="ad-field">
              <label>Nivel</label>
              <AdminDropdown variant="field" ariaLabel="Nivel" value={form.level} options={LEVELS} onChange={(level) => setForm({ ...form, level })} />
            </div>
          </div>
          {formError && <p className="modal__error">{formError}</p>}
          <div className="ad-card__footer">
            <span />
            <button type="submit" className="ad-btn ad-btn--primary" disabled={creating}>
              {creating ? 'Creando...' : 'Crear ejercicio'}
            </button>
          </div>
        </form>
      )}

      <div className="ad-toolbar">
        <label className="ad-search">
          <Icon d={ICONS.search} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar ejercicio" aria-label="Buscar ejercicio" />
        </label>
        <div className="ad-chips" role="group" aria-label="Filtrar por nivel">
          {[{ id: 'all', label: 'Todos' }, ...LEVELS].map((l) => (
            <button
              key={l.id}
              type="button"
              className={`ad-chip ${levelFilter === l.id ? 'ad-chip--active' : ''}`}
              onClick={() => setLevelFilter(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ad-table-card">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Ejercicio</th>
              <th>Sugerido</th>
              <th>Nivel</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id}>
                <td>
                  <div className="ad-cell-main">
                    <a className="ad-play" href={v.videoUrl} target="_blank" rel="noreferrer" aria-label={`Ver video de ${v.title}`}>
                      <Icon d={ICONS.play} size={12} />
                    </a>
                    <div>
                      <strong>{v.title}</strong>
                      {v.description && <small>{v.description}</small>}
                    </div>
                  </div>
                </td>
                <td className="ad-nowrap">
                  {v.defaultSets ?? '—'} × {v.defaultReps ?? '—'} · {Number(v.defaultWeight ?? 0)} kg
                </td>
                <td>
                  <AdminDropdown ariaLabel={`Nivel de ${v.title}`} value={v.level} options={LEVELS} onChange={(level) => handleLevelChange(v.id, level)} />
                </td>
                <td className="ad-actions">
                  <button type="button" className="ad-icon-btn ad-icon-btn--danger" onClick={() => handleDelete(v.id)} aria-label={`Eliminar ${v.title}`}>
                    <Icon d={ICONS.trash} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="ad-empty-row">
                  No hay ejercicios que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
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
  if (!blocks || !videos) return <Loading />;

  const activeBlockId = blockId || blocks[0]?.id;
  if (!blockId && blocks[0]) setBlockId(blocks[0].id);
  const activeBlock = blocks.find((b) => b.id === activeBlockId);

  async function handleCreateRoutine(e) {
    e.preventDefault();
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
    <>
      <SectionHeader title="Rutinas" description="Días y ejercicios de cada bloque. Una rutina genérica para todos, y personalizadas para usuarios del plan Full." />

      <div className="ad-chips ad-chips--blocks" role="tablist" aria-label="Bloque">
        {blocks.map((b) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={b.id === activeBlockId}
            className={`ad-chip ${b.id === activeBlockId ? 'ad-chip--active' : ''}`}
            onClick={() => setBlockId(b.id)}
          >
            {b.name}
          </button>
        ))}
      </div>
      {activeBlock?.objective && <p className="ad-block-objective">{activeBlock.objective}</p>}

      {routinesError && <p className="modal__error">{routinesError}</p>}

      <div className="ad-stack">
        {routines && routines.length === 0 && (
          <div className="ad-empty">
            <strong>Este bloque todavía no tiene rutinas</strong>
            <span>Creá la rutina genérica abajo y después agregale días y ejercicios.</span>
          </div>
        )}
        {routines && routines.map((routine) => <RoutineCard key={routine.id} routine={routine} videos={videos} token={token} onChange={reload} />)}

        <form className="ad-card ad-card--form" onSubmit={handleCreateRoutine}>
          <h3 className="ad-card__title">Nueva rutina en {activeBlock?.name}</h3>
          <div className="ad-row">
            <div className="ad-field ad-field--grow">
              <label>Nombre</label>
              <input value={newRoutineName} onChange={(e) => setNewRoutineName(e.target.value)} placeholder="Rutina base" />
            </div>
            <div className="ad-field ad-field--grow">
              <label>
                Usuario <span className="ad-label-hint">vacío = genérica para todos</span>
              </label>
              <input value={newRoutineUserId} onChange={(e) => setNewRoutineUserId(e.target.value)} placeholder="ID del usuario, ej: 12" />
            </div>
          </div>
          <div className="ad-card__footer">
            <span />
            <button type="submit" className="ad-btn ad-btn--primary" disabled={!newRoutineName}>
              <Icon d={ICONS.plus} />
              Crear rutina
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function RoutineCard({ routine, videos, token, onChange }) {
  const [newDay, setNewDay] = useState(String((routine.days.at(-1)?.dayNumber || 0) + 1));

  async function handleDeleteRoutine() {
    if (!confirm(`¿Eliminar "${routine.name}" y todos sus días?`)) return;
    await api.admin.deleteRoutine(routine.id, token);
    onChange();
  }

  async function handleAddDay() {
    const dayNumber = Number(newDay);
    if (!dayNumber) return;
    await api.admin.createRoutineDay(routine.id, { dayNumber, sortOrder: dayNumber }, token);
    setNewDay(String(dayNumber + 1));
    onChange();
  }

  return (
    <article className="ad-card">
      <div className="ad-card__head ad-card__head--between">
        <div className="ad-card__head">
          <h3 className="ad-card__title">{routine.name}</h3>
          {routine.userId ? (
            <span className="ad-tag ad-tag--accent">Personalizada · usuario #{routine.userId}</span>
          ) : (
            <span className="ad-tag">Genérica</span>
          )}
        </div>
        <button type="button" className="ad-icon-btn ad-icon-btn--danger" onClick={handleDeleteRoutine} aria-label={`Eliminar ${routine.name}`}>
          <Icon d={ICONS.trash} />
        </button>
      </div>

      <div className="ad-days">
        {routine.days.map((day) => (
          <RoutineDayRow key={day.id} day={day} videos={videos} token={token} onChange={onChange} />
        ))}
      </div>

      <div className="ad-add-day">
        <span>Agregar</span>
        <div className="ad-affix ad-affix--sm">
          <span>Día</span>
          <input type="number" min="1" value={newDay} onChange={(e) => setNewDay(e.target.value)} aria-label="Número de día" />
        </div>
        <button type="button" className="ad-btn" onClick={handleAddDay}>
          <Icon d={ICONS.plus} />
          Agregar día
        </button>
      </div>
    </article>
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
    <section className="ad-day">
      <div className="ad-day__head">
        <span className="ad-day__badge">Día {day.dayNumber}</span>
        <span className="ad-day__meta">
          {day.exercises.length} {day.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
        </span>
        <button type="button" className="ad-icon-btn ad-icon-btn--danger" onClick={handleDeleteDay} aria-label={`Eliminar Día ${day.dayNumber}`}>
          <Icon d={ICONS.trash} size={14} />
        </button>
      </div>

      {day.exercises.length > 0 && (
        <ol className="ad-day__list">
          {day.exercises.map((ex, i) => (
            <li key={ex.id}>
              <span className="ad-day__num">{i + 1}</span>
              <span className="ad-day__name">{ex.video.title}</span>
              <span className="ad-day__chips">
                <span>
                  {ex.suggestedSets}×{ex.suggestedReps}
                </span>
                <span>{Number(ex.suggestedWeight) > 0 ? `${Number(ex.suggestedWeight)} kg` : 'Corporal'}</span>
                {ex.suggestedRest && <span>{ex.suggestedRest}</span>}
              </span>
              <button type="button" className="ad-icon-btn" onClick={() => handleDeleteExercise(ex.id)} aria-label={`Quitar ${ex.video.title}`}>
                <Icon d={ICONS.x} size={14} />
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="ad-day__add">
        <div className="ad-field ad-field--grow">
          <label>Ejercicio</label>
          <AdminDropdown
            variant="field"
            ariaLabel="Ejercicio"
            value={videoId}
            options={videos.map((v) => ({ id: v.id, label: v.title }))}
            onChange={setVideoId}
          />
        </div>
        <div className="ad-field ad-field--xs">
          <label>Series</label>
          <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} />
        </div>
        <div className="ad-field ad-field--xs">
          <label>Reps</label>
          <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} />
        </div>
        <div className="ad-field ad-field--xs">
          <label>Kg</label>
          <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div className="ad-field ad-field--xs">
          <label>Descanso</label>
          <input type="text" placeholder="1:30" value={rest} onChange={(e) => setRest(e.target.value)} />
        </div>
        <button type="button" className="ad-btn ad-btn--primary" onClick={handleAddExercise}>
          <Icon d={ICONS.plus} />
          Agregar
        </button>
      </div>
    </section>
  );
}

// ---------- Usuarios ----------

const STATUS_OPTIONS = [
  { id: 'trial', label: 'Prueba', tone: 'beige' },
  { id: 'pending_payment', label: 'Pago pendiente', tone: 'orange' },
  { id: 'active', label: 'Activo', tone: 'green' },
  { id: 'past_due', label: 'Inactivo', tone: 'rose' },
  { id: 'canceled', label: 'Cancelado', tone: 'neutral' },
];

const ROLE_OPTIONS = [
  { id: 'user', label: 'Usuario', tone: 'neutral' },
  { id: 'admin', label: 'Admin', tone: 'dark' },
];

function UsersTab({ token }) {
  const { items, error, reload } = useEntity(() => api.admin.listUsers(token));
  const [query, setQuery] = useState('');

  if (error) return <p className="modal__error">{error}</p>;
  if (!items) return <Loading />;

  async function handleRoleChange(userItem, role) {
    await api.admin.updateUserRole(userItem.id, { role }, token);
    reload();
  }

  async function handleStatusChange(subscriptionId, status) {
    await api.admin.updateSubscriptionStatus(subscriptionId, { status }, token);
    reload();
  }

  const q = query.trim().toLowerCase();
  const filtered = items.filter((u) => !q || `${u.firstName} ${u.lastName} ${u.email} ${u.id}`.toLowerCase().includes(q));

  return (
    <>
      <SectionHeader title="Usuarios" count={items.length} description="Cambiá el estado de la suscripción o el rol de cada persona." />

      <div className="ad-toolbar">
        <label className="ad-search">
          <Icon d={ICONS.search} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, email o ID" aria-label="Buscar usuario" />
        </label>
      </div>

      <div className="ad-table-card">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const sub = u.subscriptions?.[0];
              return (
                <tr key={u.id}>
                  <td>
                    <div className="ad-cell-main">
                      <span className="ad-avatar" aria-hidden="true">
                        {(u.firstName || u.email || '?').charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <strong>
                          {u.firstName} {u.lastName} <span className="ad-id">#{u.id}</span>
                        </strong>
                        <small>{u.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{sub?.plan?.name || <span className="ad-muted">Sin plan</span>}</td>
                  <td>
                    {sub ? (
                      <AdminDropdown ariaLabel={`Estado de ${u.email}`} value={sub.status} options={STATUS_OPTIONS} onChange={(status) => handleStatusChange(sub.id, status)} />
                    ) : (
                      <span className="ad-muted">—</span>
                    )}
                  </td>
                  <td>
                    <AdminDropdown ariaLabel={`Rol de ${u.email}`} value={u.role} options={ROLE_OPTIONS} onChange={(role) => handleRoleChange(u, role)} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="ad-empty-row">
                  No hay usuarios que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
