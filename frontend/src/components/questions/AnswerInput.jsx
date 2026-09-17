import ScaleAnswerInput from './ScaleAnswerInput.jsx';
import ChoiceAnswerInput from './ChoiceAnswerInput.jsx';

// Question-type-aware answer input: Normal/Long text, Multiple Choice,
// Yes/No, and Rating 1-10 all share this one entry point so both the
// browsing card and the in-chat card render answers identically.
export default function AnswerInput({ responseType, options, value, onChange, className = '' }) {
  if (responseType === 'SCALE_1_10') {
    return <ScaleAnswerInput value={value} onChange={onChange} />;
  }
  if (responseType === 'MULTIPLE_CHOICE' || responseType === 'YES_NO') {
    return <ChoiceAnswerInput options={responseType === 'YES_NO' ? ['Yes', 'No'] : options} value={value} onChange={onChange} />;
  }
  return (
    <textarea
      autoFocus
      rows={2}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer…"
      className={`w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-blush-400/60 resize-none ${className}`}
    />
  );
}
