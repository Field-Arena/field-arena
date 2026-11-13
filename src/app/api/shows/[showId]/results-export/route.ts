import { NextResponse, type NextRequest } from 'next/server';
import { resolveShowIdParam } from '@/modules/shows/data/resolve-show-id';
import { ExportAccessError, assertCanExportResults } from '@/modules/results-export/data/access';
import { getExportInput } from '@/modules/results-export/data/get-export-input';
import { buildUsefRows } from '@/modules/results-export/utils/build-usef-rows';
import { exportFilename } from '@/modules/results-export/utils/filename';
import { toCsv } from '@/modules/results-export/formatters/csv';
import { getDatFormatter } from '@/modules/results-export/formatters/dat';
import { XLSX_CONTENT_TYPE, toXlsx } from '@/modules/results-export/formatters/xlsx';
import { isExportFormat } from '@/modules/results-export/types';

/* GET /api/shows/{show}/results-export?format=csv|dat|xlsx
 * GET /api/shows/{show}/results-export?format=csv&preview=1   (counts + warnings only)
 *
 * Every request is checked on the server against the canExportRoster grant. */
export async function GET(request: NextRequest, context: { params: Promise<{ showId: string }> }) {
  const { showId: param } = await context.params;
  const params = request.nextUrl.searchParams;
  const format = params.get('format') ?? 'csv';
  if (!isExportFormat(format)) {
    return NextResponse.json({ error: 'Choose csv, xlsx or dat.' }, { status: 400 });
  }

  try {
    const showId = await resolveShowIdParam(param);
    if (!showId) return NextResponse.json({ error: 'Show not found.' }, { status: 404 });
    await assertCanExportResults(showId);

    const input = await getExportInput(showId);
    if (!input) return NextResponse.json({ error: 'Show not found.' }, { status: 404 });
    const bundle = buildUsefRows(input);

    if (params.get('preview') === '1') {
      return NextResponse.json(
        { rowCount: bundle.rows.length, warnings: bundle.warnings },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const headers = (contentType: string, extension: string) => ({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${exportFilename(input.show.name, extension)}"`,
      'Cache-Control': 'no-store',
    });

    if (format === 'csv') {
      return new NextResponse(toCsv(bundle.header, bundle.rows), {
        headers: headers('text/csv;charset=utf-8', 'csv'),
      });
    }
    if (format === 'dat') {
      const formatter = getDatFormatter();
      return new NextResponse(formatter.format(bundle.header, bundle.rows), {
        headers: headers(formatter.contentType, formatter.extension),
      });
    }
    return new NextResponse(new Uint8Array(toXlsx(bundle.header, bundle.rows)), {
      headers: headers(XLSX_CONTENT_TYPE, 'xlsx'),
    });
  } catch (error) {
    if (error instanceof ExportAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[results-export] failed', error);
    return NextResponse.json(
      { error: 'Could not build the export. Please try again.' },
      { status: 500 },
    );
  }
}
