import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n';

// ── Currency helpers ────────────────────────────────────────────────────────
const DEFAULT_RATE = 1310;

function getRate() {
  return parseFloat(localStorage.getItem('exchangeRate') || String(DEFAULT_RATE));
}

function fmtIQD(n) {
  if (!n && n !== 0) return '—';
  return Math.round(n).toLocaleString('ar-IQ') + ' د.ع';
}
function fmtUSD(n) {
  if (!n && n !== 0) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}
// Convert to IQD equivalent using local rate
function toIQD(iqd, usd, rate) { return iqd + usd * rate; }
function toUSD(iqd, usd, rate) { return usd + iqd / rate; }

// ── Activity icons ───────────────────────────────────────────────────────────
const A_ICON  = { create: '➕', update: '✏️', delete: '🗑️' };
const A_COLOR = { create: 'text-emerald-600 bg-emerald-50', update: 'text-blue-600 bg-blue-50', delete: 'text-red-500 bg-red-50' };

// ── Stage colours ────────────────────────────────────────────────────────────
const STAGE_CLR = {
  planning:   'bg-slate-400',
  foundation: 'bg-amber-400',
  structure:  'bg-blue-500',
  finishing:  'bg-purple-500',
  handover:   'bg-emerald-500',
};

// ── Dual currency display ────────────────────────────────────────────────────
function CurrencyPair({ iqd, usd, rate, size = 'md' }) {
  const totalIQD = toIQD(iqd, usd, rate);
  const totalUSD = toUSD(iqd, usd, rate);
  const big = size === 'lg' ? 'text-3xl' : 'text-xl';
  return (
    <div>
      <p className={`font-black ${big} text-white leading-tight`}>{fmtIQD(totalIQD)}</p>
      <p className="text-white/70 text-sm mt-0.5 font-medium">≈ {fmtUSD(totalUSD)}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { lang } = useLang();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [rate, setRate]     = useState(getRate);
  const [editRate, setEditRate] = useState(false);
  const [rateInput, setRateInput] = useState(String(getRate()));

  useEffect(() => {
    api.get('/dashboard')
      .then(r => { setStats(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function saveRate() {
    const v = parseFloat(rateInput);
    if (!isNaN(v) && v > 0) {
      localStorage.setItem('exchangeRate', String(v));
      setRate(v);
      api.put('/dashboard/exchange-rate', { rate: v }).catch(() => {});
    }
    setEditRate(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-lg">
      {t(lang, 'loading')}
    </div>
  );
  if (!stats) return null;

  const { funds, salaries, contractors, materials, recentActivity, projectsByStage, activeProjects } = stats;

  // Totals across IQD + USD using the current rate
  const totalReceivedIQD = toIQD(funds.receivedIQD, funds.receivedUSD, rate);
  const totalPendingIQD  = toIQD(funds.pendingIQD,  funds.pendingUSD,  rate);
  const totalUnpaidIQD   = toIQD(salaries.unpaidIQD, salaries.unpaidUSD, rate);
  const totalContractorsIQD = toIQD(contractors.pendingIQD, contractors.pendingUSD, rate);

  const hasFinanceAlert = salaries.unpaidCount > 0 || totalPendingIQD > 0;
  const hasWarehouseAlert = materials.lowStock > 0;

  return (
    <div className="space-y-6">

      {/* ── Exchange rate bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-5 py-3 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>💱</span>
          <span>{lang === 'ar' ? 'سعر صرف الدولار' : 'USD Exchange Rate'}</span>
          <span className="font-bold text-slate-700">1 USD =</span>
        </div>
        {editRate ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="number"
              value={rateInput}
              onChange={e => setRateInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveRate(); if (e.key === 'Escape') setEditRate(false); }}
              className="w-28 px-3 py-1.5 rounded-lg border-2 border-blue-400 text-sm font-bold text-center"
            />
            <button onClick={saveRate} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              {lang === 'ar' ? 'حفظ' : 'Save'}
            </button>
            <button onClick={() => setEditRate(false)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition-colors">
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="font-black text-lg text-slate-800">{rate.toLocaleString()} <span className="text-slate-500 text-sm font-medium">د.ع</span></span>
            <button onClick={() => { setRateInput(String(rate)); setEditRate(true); }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors">
              ✏️ {lang === 'ar' ? 'تعديل' : 'Edit'}
            </button>
          </div>
        )}
      </div>

      {/* ── 4 Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">

        {/* Card 1 — Active Projects */}
        <Link to="/works/projects" className="group h-full">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all hover:-translate-y-0.5 h-full">
            {/* Background glow */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5 rounded-full" />

            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">🏗</div>
                <span className="text-blue-200 text-xs font-medium bg-white/10 px-2 py-1 rounded-full">
                  {lang === 'ar' ? 'مشاريع' : 'Projects'}
                </span>
              </div>
              <p className="text-5xl font-black text-white mb-1">{activeProjects}</p>
              <p className="text-blue-200 font-medium">{lang === 'ar' ? 'مشروع نشط' : 'Active Projects'}</p>

              {/* Stage dots */}
              {projectsByStage.length > 0 && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  {projectsByStage.map(s => (
                    <div key={s.stage} className="flex items-center gap-1.5 bg-white/15 rounded-full px-2.5 py-1">
                      <div className={`w-2 h-2 rounded-full ${STAGE_CLR[s.stage] || 'bg-white'}`} />
                      <span className="text-white/90 text-xs font-medium">{t(lang, `stages.${s.stage}`)}: {s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Card 2 — Incoming Funds */}
        <Link to="/finance/funds" className="group h-full">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all hover:-translate-y-0.5 h-full">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5 rounded-full" />

            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">💵</div>
                <span className="text-emerald-100 text-xs font-medium bg-white/10 px-2 py-1 rounded-full">
                  {lang === 'ar' ? 'وارد' : 'Funds'}
                </span>
              </div>

              {/* Received total */}
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wide mb-1">
                {lang === 'ar' ? 'المستلم' : 'Received'}
              </p>
              <CurrencyPair iqd={funds.receivedIQD} usd={funds.receivedUSD} rate={rate} size="lg" />

              {/* Pending row */}
              {totalPendingIQD > 0 && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-white/70 text-xs">
                    {lang === 'ar' ? 'قيد الاستلام: ' : 'Pending: '}
                    <span className="font-bold text-white">{fmtIQD(totalPendingIQD)}</span>
                    <span className="text-white/60"> ≈ {fmtUSD(totalPendingIQD / rate)}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Card 3 — Financial Alerts (Salaries + Contractors) */}
        <Link to="/finance/salaries" className="group h-full">
          <div className={`relative overflow-hidden rounded-3xl p-6 shadow-lg transition-all hover:-translate-y-0.5 h-full
            ${hasFinanceAlert
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-200 hover:shadow-amber-300'
              : 'bg-gradient-to-br from-slate-600 to-slate-800 shadow-slate-200 hover:shadow-slate-300'
            }`}>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5 rounded-full" />

            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                  {hasFinanceAlert ? '⚠️' : '✅'}
                </div>
                <span className="text-white/80 text-xs font-medium bg-white/10 px-2 py-1 rounded-full">
                  {lang === 'ar' ? 'المدفوعات' : 'Payments'}
                </span>
              </div>

              {/* Unpaid salaries */}
              <div className="mb-3">
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">
                  {lang === 'ar' ? 'رواتب غير مدفوعة' : 'Unpaid Salaries'}
                </p>
                <p className="text-4xl font-black text-white">{salaries.unpaidCount}</p>
                {totalUnpaidIQD > 0 && (
                  <p className="text-white/80 text-sm font-medium mt-0.5">
                    {fmtIQD(totalUnpaidIQD)}
                    <span className="text-white/60 text-xs"> ≈ {fmtUSD(totalUnpaidIQD / rate)}</span>
                  </p>
                )}
              </div>

              {/* Pending contractors */}
              {totalContractorsIQD > 0 && (
                <div className="pt-3 border-t border-white/20">
                  <p className="text-white/70 text-xs">
                    {lang === 'ar' ? 'مقاولون معلقة: ' : 'Contractors pending: '}
                    <span className="font-bold text-white">{fmtIQD(totalContractorsIQD)}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Card 4 — Warehouse */}
        <Link to="/warehouse" className="group h-full">
          <div className={`relative overflow-hidden rounded-3xl p-6 shadow-lg transition-all hover:-translate-y-0.5 h-full
            ${hasWarehouseAlert
              ? 'bg-gradient-to-br from-red-500 to-rose-700 shadow-red-200 hover:shadow-red-300'
              : 'bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-indigo-200 hover:shadow-indigo-300'
            }`}>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5 rounded-full" />

            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">🏭</div>
                <span className="text-white/80 text-xs font-medium bg-white/10 px-2 py-1 rounded-full">
                  {lang === 'ar' ? 'المخزن' : 'Warehouse'}
                </span>
              </div>

              <p className="text-5xl font-black text-white mb-1">{materials.total}</p>
              <p className="text-white/80 font-medium">{lang === 'ar' ? 'مادة في المخزن' : 'Materials'}</p>

              {/* Low stock warning */}
              {materials.lowStock > 0 ? (
                <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <p className="text-white font-bold text-sm">
                    {materials.lowStock} {lang === 'ar' ? 'مواد وصلت للحد الأدنى!' : 'materials at low stock!'}
                  </p>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <p className="text-white/80 text-sm">{lang === 'ar' ? 'المخزون سليم' : 'Stock levels OK'}</p>
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* ── Bottom panels ─────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Projects by stage */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>📊</span>
            {lang === 'ar' ? 'المشاريع حسب المرحلة' : 'Projects by Stage'}
          </h2>
          {projectsByStage.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">{t(lang, 'noData')}</p>
          ) : (
            <div className="space-y-3">
              {projectsByStage.map(row => (
                <div key={row.stage} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STAGE_CLR[row.stage] || 'bg-slate-400'}`} />
                  <span className="text-sm text-slate-600 w-20 flex-shrink-0">{t(lang, `stages.${row.stage}`)}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${STAGE_CLR[row.stage] || 'bg-slate-400'}`}
                      style={{ width: activeProjects ? `${(row.count / activeProjects) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-700 w-6 text-center">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>🕐</span>
            {t(lang, 'recentActivity')}
          </h2>
          {recentActivity.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">{t(lang, 'noData')}</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {recentActivity.map(a => (
                <div key={a.id} className="flex items-start gap-3 text-sm p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${A_COLOR[a.action] || 'bg-slate-100 text-slate-500'}`}>
                    {A_ICON[a.action] || '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 leading-tight">{a.description}</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {a.user_name} · {new Date(a.created_at).toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
