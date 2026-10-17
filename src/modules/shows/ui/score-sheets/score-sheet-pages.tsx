import type { ScoreSheet, ScoreSheetPack } from '@/modules/shows/data/score-sheet-queries';

const LAB = 'text-[9.5px] font-bold uppercase tracking-[.08em] text-[#5A6B63]';
const VAL = 'mt-px text-[15px] font-bold text-[#111]';
const TH =
  'border border-[#9AA6A0] bg-[#EDF0EE] px-1.5 py-1 text-left text-[9.5px] uppercase tracking-[.06em]';
const TD = 'border border-[#9AA6A0] px-1.5 align-middle';

/* The rider sticker printed across the top of every sheet. */
export function RiderSticker({ sheet, showName }: { sheet: ScoreSheet; showName: string }) {
  const cell = 'border-r border-b border-[#C9D3CE] px-3 py-[7px]';
  return (
    <div className="grid grid-cols-[1fr_1fr_150px] overflow-hidden rounded-[10px] border-[2.5px] border-[#0D2C23]">
      <div className={cell}>
        <div className={LAB}>Show</div>
        <div className={VAL}>{showName}</div>
      </div>
      <div className={cell}>
        <div className={LAB}>Date · Ring · Ride time</div>
        <div className={VAL}>
          {sheet.dateLabel} · {sheet.ring} · {sheet.rideTime}
        </div>
      </div>
      <div className="col-start-3 row-span-3 row-start-1 flex flex-col items-center justify-center bg-[#0D2C23] text-white">
        <div className={`${LAB} text-[#C9D9D0]`}>Entry #</div>
        <b className="text-[48px] leading-none font-bold">{sheet.entryNumber}</b>
      </div>
      <div className={cell}>
        <div className={LAB}>Rider</div>
        <div className={VAL}>{sheet.rider}</div>
      </div>
      <div className={cell}>
        <div className={LAB}>Horse</div>
        <div className={VAL}>{sheet.horse}</div>
      </div>
      <div className={`${cell} border-b-0`}>
        <div className={LAB}>Test name</div>
        <div className={VAL}>{sheet.test?.testName ?? sheet.classLabel}</div>
      </div>
      <div className={`${cell} border-b-0`}>
        <div className={LAB}>Test number</div>
        <div className={VAL}>{sheet.test?.testNumber ?? '—'}</div>
      </div>
    </div>
  );
}

/* One letter-size page: sticker, then the blank test. */
function SheetPage({ sheet, showName }: { sheet: ScoreSheet; showName: string }) {
  const test = sheet.test;
  return (
    <section className="mx-auto mb-6 box-border h-[1056px] w-[816px] [break-after:page] bg-white px-10 py-[34px] text-[#111] shadow-[0_10px_30px_rgba(0,0,0,.18)] print:mb-0 print:shadow-none">
      <RiderSticker sheet={sheet} showName={showName} />
      <div className="mt-3.5 mb-1.5 flex items-baseline justify-between">
        <h2 className="m-0 text-[22px] font-bold">{test?.title ?? sheet.classLabel}</h2>
        <span className="text-[11px] font-semibold text-[#3F4F48]">
          {[
            test?.arena && `Arena: ${test.arena}`,
            test?.rideTime && `Ride time ${test.rideTime}`,
            test?.maxPoints && `Max ${String(test.maxPoints)}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
      {test ? (
        <>
          <table className="w-full border-collapse text-[11.5px]">
            <thead>
              <tr>
                <th className={`${TH} w-[30px]`}>#</th>
                <th className={TH}>Test</th>
                <th className={`${TH} w-[56px]`}>Points 0–10</th>
                <th className={`${TH} w-[44px]`}>Coef.</th>
                <th className={`${TH} w-[56px]`}>Final</th>
                <th className={TH}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {test.movements.map((m, i) => (
                <tr key={`${String(m.num)}-${String(i)}`} className="h-[30px]">
                  <td className={`${TD} text-center font-bold`}>{m.num ?? i + 1}</td>
                  <td className={`${TD} w-[300px]`}>{m.text}</td>
                  <td className={TD} />
                  <td className={`${TD} text-center font-bold`}>{m.coef}</td>
                  <td className={TD} />
                  <td className={TD} />
                </tr>
              ))}
              {test.collectives.length > 0 && (
                <tr>
                  <th className={TH} colSpan={6}>
                    Collective marks
                  </th>
                </tr>
              )}
              {test.collectives.map((c) => (
                <tr key={c.label} className="h-[30px]">
                  <td className={TD} />
                  <td className={TD}>{c.label}</td>
                  <td className={TD} />
                  <td className={`${TD} text-center font-bold`}>{c.coef}</td>
                  <td className={TD} />
                  <td className={TD} />
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2.5 grid grid-cols-3 gap-3 text-[11px]">
            <div className="h-11 rounded-md border border-[#9AA6A0] px-2 py-1.5 font-bold">
              Errors / omissions
            </div>
            <div className="h-11 rounded-md border border-[#9AA6A0] px-2 py-1.5">
              <b>Total points</b> ____{test.maxPoints ? ` / ${String(test.maxPoints)}` : ''} &nbsp;
              <b>%</b> ____
            </div>
            <div className="h-11 rounded-md border border-[#9AA6A0] px-2 py-1.5 font-bold">
              Judge signature
            </div>
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-lg border-2 border-dashed border-[#C9A227] p-6 text-[14px] text-[#5A3E00]">
          No test is assigned to <b>{sheet.classLabel}</b>, so this page has the sticker only.
          Assign the test in Show Manager → Test Builder and print again.
        </div>
      )}
    </section>
  );
}

/** Every sheet in the pack, one page each, ready to print or save as PDF. */
export function ScoreSheetPages({ pack }: { pack: ScoreSheetPack }) {
  return (
    <div data-print-report>
      {pack.sheets.map((sheet) => (
        <SheetPage key={sheet.entryId} sheet={sheet} showName={pack.showName} />
      ))}
    </div>
  );
}
