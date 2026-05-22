from io import BytesIO

from pypdf import PdfReader

from models.schemas import PageText

def extract_pages(pdf_bytes: bytes) -> list[PageText]:
    pdf = PdfReader(BytesIO(pdf_bytes))

    pages = []

    for index, page in enumerate(pdf.pages):
        text = page.extract_text() or ""

        pages.append(
            PageText(
                page_number=index + 1,
                text=text,
            )
        )

    return pages