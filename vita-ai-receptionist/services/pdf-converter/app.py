import io
import zipfile

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
import fitz

app = FastAPI()

# Limite de páginas convertidas por arquivo (cada página vira uma análise na OpenAI)
MAX_PAGINAS = 10


@app.post("/convert")
async def convert_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Arquivo precisa ser PDF")

    pdf_bytes = await file.read()

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        if len(doc) == 0:
            raise HTTPException(status_code=400, detail="PDF vazio")

        page = doc[0]

        matrix = fitz.Matrix(2, 2)

        pix = page.get_pixmap(matrix=matrix, alpha=False)

        png_bytes = pix.tobytes("png")

        return Response(
            content=png_bytes,
            media_type="image/png"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _paginas_png(dados: bytes):
    """Devolve (total_de_paginas, [png, ...]) de um PDF ou de uma imagem.

    O tipo é detectado pelo conteúdo, não pelo content-type do upload
    (o n8n pode enviar o binário como application/octet-stream).
    """
    if dados[:5] == b"%PDF-":
        doc = fitz.open(stream=dados, filetype="pdf")
        if doc.needs_pass:
            raise HTTPException(status_code=400, detail="PDF protegido por senha")
        if len(doc) == 0:
            raise HTTPException(status_code=400, detail="PDF vazio")
        matrix = fitz.Matrix(2, 2)
        pngs = [
            doc[i].get_pixmap(matrix=matrix, alpha=False).tobytes("png")
            for i in range(min(len(doc), MAX_PAGINAS))
        ]
        return len(doc), pngs

    # Imagem (JPEG, PNG, ...): converte para um único PNG RGB, sem redimensionar
    try:
        pix = fitz.Pixmap(dados)
    except Exception:
        raise HTTPException(status_code=400, detail="Arquivo precisa ser PDF ou imagem")
    if pix.colorspace is None or pix.colorspace.n != 3:
        pix = fitz.Pixmap(fitz.csRGB, pix)
    if pix.alpha:
        pix = fitz.Pixmap(pix, 0)
    return 1, [pix.tobytes("png")]


@app.post("/convert-all")
async def convert_all(file: UploadFile = File(...)):
    """Converte um PDF (até MAX_PAGINAS) ou uma imagem em PNGs, devolvidos num ZIP.

    O fluxo do n8n descompacta o ZIP (nó Compression) e analisa cada página.
    """
    dados = await file.read()
    if not dados:
        raise HTTPException(status_code=400, detail="Arquivo vazio")

    try:
        total, pngs = _paginas_png(dados)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_STORED) as zf:
        for i, png in enumerate(pngs, start=1):
            zf.writestr(f"pagina_{i:02d}.png", png)

    return Response(
        content=buf.getvalue(),
        media_type="application/zip",
        headers={
            "Content-Disposition": 'attachment; filename="paginas.zip"',
            "X-Total-Paginas": str(total),
            "X-Paginas-Convertidas": str(len(pngs)),
        },
    )
