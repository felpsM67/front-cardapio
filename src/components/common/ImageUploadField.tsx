import { ImagePlus, RefreshCw, Trash2, UploadCloud } from 'lucide-react';

interface Props {
  value?: string;
  onFile: (file?: File) => void | Promise<void>;
  onRemove?: () => void;
  title?: string;
  description?: string;
  previewClassName?: string;
}

export function ImageUploadField({ value, onFile, onRemove, title = 'Adicionar imagem', description = 'PNG, JPG ou WEBP', previewClassName = 'aspect-video' }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-dashed border-orange-300 bg-gradient-to-br from-orange-50 to-white p-3 sm:col-span-2">
      {value ? (
        <div className="relative overflow-hidden rounded-xl bg-slate-100">
          <img src={value} alt="Pré-visualização" className={`${previewClassName} w-full object-cover`} />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-800 shadow-lg transition hover:bg-orange-50">
              <RefreshCw size={16} /> Trocar imagem
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            {onRemove && <button type="button" onClick={onRemove} className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-sm font-black text-white shadow-lg hover:bg-red-600"><Trash2 size={16} /> Remover</button>}
          </div>
        </div>
      ) : (
        <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-orange-100 bg-white px-5 py-8 text-center transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600"><UploadCloud size={28} /></span>
          <strong className="mt-4 flex items-center gap-2 text-slate-900"><ImagePlus size={18} className="text-orange-500" /> {title}</strong>
          <span className="mt-1 text-sm text-slate-500">{description}</span>
          <span className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-black text-white">Escolher arquivo</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
      )}
    </div>
  );
}
