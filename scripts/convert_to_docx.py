import os
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH

def create_report():
    # Paths
    md_path = r'C:\Users\ADMIN\OneDrive\Desktop\assingment\ADA-V2-My-utmost-Creation\research\ADA_V2_MASTER_RESEARCH_REPORT.md'
    docx_path = r'C:\Users\ADMIN\OneDrive\Desktop\assingment\ADA-V2-My-utmost-Creation\research\ADA_V2_MASTER_RESEARCH_REPORT.docx'

    if not os.path.exists(md_path):
        print(f"Error: Source file {md_path} not found.")
        return

    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    doc = Document()

    # Set A4 and margins
    section = doc.sections[0]
    section.page_height = Cm(29.7)
    section.page_width = Cm(21.0)
    section.left_margin = Cm(2.54)
    section.right_margin = Cm(2.54)
    section.top_margin = Cm(2.54)
    section.bottom_margin = Cm(2.54)

    # 1. Cover Page
    cover = doc.add_paragraph()
    cover.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = cover.add_run('\n\n\n\nADA-V2 MASTER RESEARCH REPORT\n')
    run.bold = True
    run.font.size = Pt(24)

    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = subtitle.add_run('Research Proposal: Proactive Native Speech-to-Speech Assistance\nand Task Interruption Management\n\n')
    run_sub.italic = True
    run_sub.font.size = Pt(14)

    details = doc.add_paragraph()
    details.alignment = WD_ALIGN_PARAGRAPH.CENTER
    details.add_run('\n\nStudent Name: [Student Name]\n')
    details.add_run('Student ID: [Student ID]\n')
    details.add_run('Institution: [Institution Name]\n')
    details.add_run('Programme: [Programme Name]\n')
    details.add_run('Lecturer/Supervisor: [Lecturer Name]\n\n')
    details.add_run('Document Status: Proposal — Awaiting Lecturer Approval\n')
    details.add_run('Date: 2026-10-24')

    doc.add_page_break()

    # 2. Table of Contents Placeholder
    doc.add_heading('Table of Contents', level=1)
    doc.add_paragraph('TOC generated automatically by Word. Please update on open.')
    doc.add_page_break()

    # 3. Body Content
    is_title_page = True
    for line in lines:
        line = line.strip()
        if not line:
            continue

        if is_title_page and line.startswith('# '):
            is_title_page = False
            continue

        if line.startswith('# '):
            doc.add_heading(line[2:], level=1)
        elif line.startswith('## '):
            doc.add_heading(line[3:], level=2)
        elif line.startswith('### '):
            doc.add_heading(line[4:], level=3)
        elif line.startswith('- '):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Pt(20)
            p.add_run(line[2:])
        elif line.startswith('**'):
            p = doc.add_paragraph()
            run = p.add_run(line.replace('**', ''))
            run.bold = True
        else:
            p = doc.add_paragraph(line)
            p.paragraph_format.line_spacing = 1.5

    # Apply font to entire document
    for paragraph in doc.paragraphs:
        for run in paragraph.runs:
            run.font.name = 'Times New Roman'
            run.font.size = Pt(12)

    doc.save(docx_path)
    print(f"Successfully created: {docx_path}")

if __name__ == "__main__":
    create_report()
