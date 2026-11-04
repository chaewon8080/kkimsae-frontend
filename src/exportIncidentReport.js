function waitForImage(image, timeout = 15000) {
  return new Promise((resolve, reject) => {
    let timer;

    const cleanup = () => {
      clearTimeout(timer);
      image.removeEventListener('load', loaded);
      image.removeEventListener('error', failed);
    };

    const loaded = () => {
      cleanup();

      if (image.naturalWidth > 0) {
        resolve();
      } else {
        reject(new Error('증거 이미지를 불러오지 못했습니다.'));
      }
    };

    const failed = () => {
      cleanup();
      reject(new Error('증거 이미지를 불러오지 못했습니다.'));
    };

    if (image.complete) {
      loaded();
      return;
    }

    image.addEventListener('load', loaded);
    image.addEventListener('error', failed);

    timer = setTimeout(() => {
      cleanup();

      reject(
        new Error(
          '이미지 로딩 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'
        )
      );
    }, timeout);
  });
}

export async function exportIncidentReport({
  content,
  title,
}) {
  if (!content) {
    throw new Error('저장할 사건 내용을 찾지 못했습니다.');
  }

  const sourceImages = [...content.querySelectorAll('img')];

  // 화면에 있는 증거 이미지가 로딩된 뒤 문서를 만듭니다.
  await Promise.all(sourceImages.map((image) => waitForImage(image)));

  const frame = document.createElement('iframe');

  frame.title = '사건 정리본 인쇄';
  frame.setAttribute('aria-hidden', 'true');

  Object.assign(frame.style, {
    position: 'fixed',
    width: '1px',
    height: '1px',
    right: '0',
    bottom: '0',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  });

  document.body.appendChild(frame);

  const printDocument = frame.contentDocument;
  const printWindow = frame.contentWindow;

  if (!printDocument || !printWindow) {
    frame.remove();
    throw new Error('인쇄 문서를 열지 못했습니다.');
  }

  const cleanup = () => {
    frame.remove();
  };

  try {
    printDocument.documentElement.lang = 'ko';
    printDocument.title = `${title || '사건'} - 사건 정리본`;

    const charset = printDocument.createElement('meta');
    charset.setAttribute('charset', 'utf-8');
    printDocument.head.appendChild(charset);

    const style = printDocument.createElement('style');

    style.textContent = `
      @page {
        size: A4;
        margin: 18mm 16mm;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        color: #24364a;
        background: white;
        font-family: Arial, "Malgun Gothic", sans-serif;
        font-size: 10pt;
        line-height: 1.8;
        overflow-wrap: anywhere;
      }

      .reportHeader {
        padding-bottom: 16px;
        margin-bottom: 28px;
        border-bottom: 3px solid #2867aa;
      }

      .reportBrand {
        color: #2867aa;
        font-size: 12pt;
        font-weight: 700;
      }

      .reportHeader h1 {
        margin: 8px 0;
        color: #172e45;
        font-size: 23pt;
        line-height: 1.4;
      }

      .reportHeader p,
      .reportFooter {
        color: #68798b;
        font-size: 9pt;
      }

      .reportHeader p {
        margin: 4px 0;
      }

      h2 {
        margin: 0 0 14px;
        font-size: 18pt;
        line-height: 1.5;
      }

      h3 {
        margin: 24px 0 12px;
        color: #215b94;
        font-size: 12pt;
        break-after: avoid;
      }

      h4 {
        break-after: avoid;
      }

      p {
        margin: 8px 0;
        white-space: pre-wrap;
      }

      table {
        width: 100%;
        margin: 12px 0;
        border-collapse: collapse;
        table-layout: fixed;
      }

      th,
      td {
        padding: 9px 11px;
        border: 1px solid #dce4ed;
        text-align: left;
        vertical-align: top;
        white-space: pre-wrap;
      }

      th {
        color: #46617c;
        background: #f0f5fa;
        font-weight: 600;
      }

      .caseInfoTable th {
        width: 30%;
      }

      .caseEvidenceTable th:first-child {
        width: 24%;
      }

      thead {
        display: table-header-group;
      }

      tr {
        break-inside: avoid;
      }

      .caseReadableDates {
        margin: 12px 0 20px;
        color: #68798b;
        font-size: 9pt;
      }

      .caseReadableDates > span {
        display: inline-block;
        margin-right: 20px;
      }

      .caseReadableDates time {
        margin-left: 6px;
      }

      .caseReadableDescription,
      .caseTimelineContent {
        white-space: pre-wrap;
      }

      .caseTimelineCard {
        margin: 12px 0;
        padding: 14px 16px;
        border-left: 3px solid #2867aa;
        background: #f6f9fc;
      }

      .caseTimelineCardTop {
        break-after: avoid;
      }

      .caseTimelineTime {
        color: #46617c;
        font-weight: 600;
      }

      .caseTimelineNumber {
        margin-right: 10px;
        color: #7b8da0;
      }

      .caseTimelineTagLine {
        color: #68798b;
        font-size: 9pt;
      }

      .caseTimelineTagLabel {
        margin-right: 10px;
      }

      img {
        display: block;
        width: auto;
        height: auto;
        max-width: 100%;
        max-height: 220mm;
        object-fit: contain;
        margin: 14px auto;
        break-inside: avoid;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      .reportFooter {
        margin-top: 30px;
        padding-top: 14px;
        border-top: 1px solid #dce4ed;
      }

      button,
      input,
      textarea,
      select,
      .caseReadableActions,
      .caseReadableStatus,
      .caseTimelineAddButton,
      .caseTimelineEditButton,
      .reportExclude {
        display: none !important;
      }
    `;

    printDocument.head.appendChild(style);

    const header = printDocument.createElement('header');
    header.className = 'reportHeader';

    const brand = printDocument.createElement('div');
    brand.className = 'reportBrand';
    brand.textContent = '낌새';

    const heading = printDocument.createElement('h1');
    heading.textContent = '사건 정리본';

    const created = printDocument.createElement('p');
    created.textContent =
      `정리본 생성: ${new Date().toLocaleString('ko-KR')}`;

    const description = printDocument.createElement('p');
    description.textContent =
      '사용자가 기록한 내용을 정리한 참고 자료이며 공식 신고서가 아닙니다.';

    header.append(brand, heading, created, description);

    const clone = content.cloneNode(true);

    // 버튼, 입력 폼 등 문서에 필요 없는 요소 제거
    clone
      .querySelectorAll(
        'button, form, script, iframe, .reportExclude'
      )
      .forEach((element) => element.remove());

    // 원본 화면에서 실제로 로딩된 이미지 주소 사용
    const clonedImages = [...clone.querySelectorAll('img')];

    clonedImages.forEach((image, index) => {
      image.removeAttribute('srcset');
      image.removeAttribute('sizes');
      image.removeAttribute('loading');

      image.src =
        sourceImages[index].currentSrc ||
        sourceImages[index].src;
    });

    // 단서 표의 복사 열 제거
    clone
      .querySelectorAll('.caseEvidenceTable tr')
      .forEach((row) => {
        if (row.cells.length === 3) {
          row.deleteCell(2);
        }

        [...row.cells].forEach((cell) => {
          if (cell.colSpan === 3) {
            cell.colSpan = 2;
          }
        });
      });

    const footer = printDocument.createElement('footer');
    footer.className = 'reportFooter';
    footer.textContent =
      '첨부 이미지는 화면에 표시된 사본입니다. 원본 증거 파일은 별도로 보관해주세요.';

    printDocument.body.append(header, clone, footer);

    await Promise.all(
      [...printDocument.images].map((image) => waitForImage(image))
    );

    await printDocument.fonts.ready;

    // 인쇄 취소·완료 후 임시 문서 정리
    printWindow.addEventListener('afterprint', cleanup, {
      once: true,
    });

    // 인쇄 준비를 마친 뒤 대화상자를 엽니다.
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    printWindow.focus();
    printWindow.print();

    // afterprint를 전달하지 않는 브라우저의 정리용
    setTimeout(cleanup, 5 * 60 * 1000);
  } catch (error) {
    cleanup();
    throw error;
  }
}