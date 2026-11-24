import React from 'react';
import {
  UtensilsCrossed,
  ShoppingCart,
  Factory,
  Code2,
  GraduationCap,
  Truck,
  Briefcase,
} from 'lucide-react';
import type { IndustryTag } from '../../../types';
import { INDUSTRY_TAGS } from '../../../data/baseProfile';

interface IndustryTagsSectionProps {
  selectedTags: IndustryTag[];
  isSurveyCompleted: boolean;
  onToggleTag: (tag: IndustryTag) => void;
}

function getIndustryIcon(iconName: string) {
  switch (iconName) {
    case 'UtensilsCrossed':
      return <UtensilsCrossed className="w-4 h-4 text-amber-600 shrink-0" />;
    case 'ShoppingCart':
      return <ShoppingCart className="w-4 h-4 text-purple-600 shrink-0" />;
    case 'Code2':
      return <Code2 className="w-4 h-4 text-teal-600 shrink-0" />;
    case 'Factory':
      return <Factory className="w-4 h-4 text-orange-600 shrink-0" />;
    case 'GraduationCap':
      return <GraduationCap className="w-4 h-4 text-rose-600 shrink-0" />;
    case 'Truck':
      return <Truck className="w-4 h-4 text-sky-600 shrink-0" />;
    default:
      return <Briefcase className="w-4 h-4 text-slate-600 shrink-0" />;
  }
}

export const IndustryTagsSection: React.FC<IndustryTagsSectionProps> = ({
  selectedTags,
  isSurveyCompleted,
  onToggleTag,
}) => (
  <div className="pt-2 border-t border-slate-100">
    <div className="flex items-center justify-between mb-2">
      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
        Chọn Ngành nghề &amp; Hoạt động thực tế: <span className="text-rose-500">*</span>
      </label>
      <span className="text-[11px] text-slate-500">Được chọn nhiều ngành thực tế</span>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {INDUSTRY_TAGS.map((tag) => {
        const isSelected = selectedTags.includes(tag.id);
        return (
          <div
            key={tag.id}
            onClick={() => {
              if (!isSurveyCompleted) onToggleTag(tag.id);
            }}
            className={`p-3.5 rounded-xl border text-xs transition-all ${
              isSurveyCompleted ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
            } ${
              isSelected
                ? 'bg-teal-50/80 border-teal-500 shadow-sm ring-1 ring-teal-500'
                : isSurveyCompleted
                  ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-1.5 rounded-lg bg-slate-100 shrink-0">
                {getIndustryIcon(tag.iconName)}
              </div>
              <h4 className="font-bold text-slate-900 leading-snug">{tag.label}</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">{tag.description}</p>
          </div>
        );
      })}
    </div>
  </div>
);
