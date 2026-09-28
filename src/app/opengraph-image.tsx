import { ImageResponse } from 'next/og';

export const alt = 'Criterion: IB-style timed papers, examiner marking and Socratic tutoring';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Link preview card in the Subject Report palette: graphite shell, the Criterion mark, examiner ink.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: '#15181c',
          color: '#e9ecef',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#e9ecef" strokeWidth={2} strokeLinecap="square">
            <path d="M8 3.5H4.5v17H8" />
            <path d="M16 3.5h3.5v17H16" />
            <path d="M8.5 12.5l2.25 2.5L15.5 9" />
          </svg>
          <div style={{ fontSize: 88, fontWeight: 700 }}>Criterion</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 40, color: '#a4adb8', maxWidth: 960 }}>
          Sit IB-style papers under timed conditions, get method-level marking with ECF, and practise with a Socratic tutor.
        </div>
      </div>
    ),
    size
  );
}
