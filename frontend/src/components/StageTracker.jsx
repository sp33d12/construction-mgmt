import { useLang } from '../contexts/LangContext';
import { t } from '../i18n';

const STAGES = ['planning', 'foundation', 'structure', 'finishing', 'handover'];

export default function StageTracker({ stage }) {
  const { lang } = useLang();
  const current = STAGES.indexOf(stage);

  return (
    <div className="flex items-center gap-0 w-full">
      {STAGES.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                done ? 'bg-emerald-500 border-emerald-500 text-white' :
                active ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg shadow-blue-200' :
                'bg-white border-slate-200 text-slate-400'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`mt-1 text-[10px] text-center leading-tight ${active ? 'text-blue-600 font-semibold' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                {t(lang, `stages.${s}`)}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 rounded ${i < current ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
