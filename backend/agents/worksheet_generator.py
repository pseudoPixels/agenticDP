from google import genai
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, PageBreak, KeepTogether
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
import json
import re
import io
import base64
from typing import Dict, List, Any, Optional
from .image_generator import ImageGeneratorAgent


class WorksheetGeneratorAgent:
    """Agent responsible for generating educational worksheets with PDF export"""
    
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-2.0-flash-exp'
        self.image_generator = ImageGeneratorAgent(api_key)
        
    def generate_worksheet(self, topic: str) -> Dict[str, Any]:
        """Generate a comprehensive worksheet on the given topic"""
        
        prompt = f"""You are an expert educational worksheet designer. Create a comprehensive, engaging worksheet based on: "{topic}"

Analyze the topic to determine:
1. The appropriate grade level (K-12)
2. The subject area (Math, Science, English, Social Studies, etc.)
3. The best worksheet type(s) to use

WORKSHEET TYPES TO CHOOSE FROM:
- practice_mastery: Daily skill drills (10-20 numbered items, clean spacing)
- instructional_reading: Reading passage with comprehension questions
- visual_tracing: For Pre-K to Grade 2 (tracing, recognition, matching with visual elements)
- diagram_labeling: Label diagrams, categorize items, or match items visually
- fill_in_blank: Complete sentences or paragraphs with missing words
- short_answer: Questions requiring brief written responses
- matching: Match items from two columns
- word_problems: Math or logic problems requiring multi-step solutions
- creative_writing: Writing prompts with space for responses

Structure your response as valid JSON:
{{
    "title": "Worksheet title",
    "subtitle": "Grade level and subject",
    "grade_level": "Grade X" or "Grades X-Y",
    "subject": "Subject name",
    "instructions": "Clear instructions for students",
    "estimated_time": "15-30 minutes",
    "sections": [
        {{
            "type": "practice_mastery",
            "title": "Section title",
            "instructions": "Specific instructions for this section",
            "items": [
                {{"question": "Problem or question", "answer_space": "small|medium|large"}},
                ...
            ],
            "image_prompt": "Educational image description (optional)"
        }},
        {{
            "type": "instructional_reading",
            "title": "Reading Comprehension",
            "passage": "Age-appropriate reading passage (3-7 paragraphs)",
            "questions": [
                {{"question": "Comprehension question", "points": 2}},
                ...
            ],
            "image_prompt": "Illustration for the passage"
        }},
        {{
            "type": "diagram_labeling",
            "title": "Label the Diagram",
            "instructions": "Label the parts shown in the diagram",
            "diagram_description": "Detailed description of what to show in diagram",
            "labels": ["Label 1", "Label 2", "Label 3", ...],
            "image_prompt": "Detailed diagram description"
        }},
        {{
            "type": "matching",
            "title": "Match the Following",
            "column_a": ["Item 1", "Item 2", ...],
            "column_b": ["Match 1", "Match 2", ...],
            "image_prompt": "Supporting visual (optional)"
        }},
        {{
            "type": "creative_writing",
            "title": "Writing Prompt",
            "prompt": "Engaging writing prompt",
            "lines": 15,
            "image_prompt": "Inspiring image for the prompt"
        }}
    ]
}}

IMPORTANT GUIDELINES:
- Choose 2-4 section types that best fit the topic and grade level
- For younger grades (K-2): Use visual_tracing, diagram_labeling, simple matching
- For elementary (3-5): Mix practice_mastery, short_answer, diagram_labeling
- For middle school (6-8): Use instructional_reading, word_problems, short_answer
- For high school (9-12): Focus on analysis, creative_writing, complex problems
- Include 10-25 total questions/items across all sections
- Make content age-appropriate in vocabulary and complexity
- EVERY section should have an image_prompt for visual appeal
- Keep instructions clear and concise
- Ensure proper spacing for student answers

Return ONLY the JSON, no markdown formatting."""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[prompt]
            )
            
            worksheet_text = response.text.strip()
            worksheet_text = re.sub(r'^```json\s*', '', worksheet_text)
            worksheet_text = re.sub(r'\s*```$', '', worksheet_text)
            
            worksheet_data = json.loads(worksheet_text)
            worksheet_data['topic'] = topic
            worksheet_data['version'] = 1
            
            return worksheet_data
            
        except Exception as e:
            print(f"Error generating worksheet: {e}")
            import traceback
            traceback.print_exc()
            return self._create_fallback_worksheet(topic)
    
    def _create_fallback_worksheet(self, topic: str) -> Dict[str, Any]:
        """Create a basic worksheet if generation fails"""
        return {
            "title": f"Worksheet: {topic}",
            "subtitle": "Educational Worksheet",
            "grade_level": "General",
            "subject": "General",
            "topic": topic,
            "version": 1,
            "instructions": "Complete all questions to the best of your ability.",
            "estimated_time": "20 minutes",
            "sections": [
                {
                    "type": "short_answer",
                    "title": "Questions",
                    "instructions": "Answer the following questions in complete sentences.",
                    "items": [
                        {"question": f"What do you know about {topic}?", "answer_space": "large"},
                        {"question": f"Why is {topic} important?", "answer_space": "large"},
                        {"question": f"Give an example related to {topic}.", "answer_space": "large"}
                    ],
                    "image_prompt": f"Educational illustration about {topic}"
                }
            ]
        }
    
    def create_pdf(self, worksheet_data: Dict[str, Any], images: Dict[str, str]) -> io.BytesIO:
        """Create a high-quality PDF from worksheet data and images"""
        
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch
        )
        
        # Container for PDF elements
        story = []
        
        # Define styles
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=HexColor('#10b981'),  # emerald-500
            spaceAfter=6,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Normal'],
            fontSize=14,
            textColor=HexColor('#6b7280'),  # gray-500
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Oblique'
        )
        
        instructions_style = ParagraphStyle(
            'Instructions',
            parent=styles['Normal'],
            fontSize=11,
            textColor=HexColor('#1f2937'),  # gray-800
            spaceAfter=12,
            leftIndent=20,
            rightIndent=20,
            alignment=TA_JUSTIFY,
            fontName='Helvetica'
        )
        
        section_title_style = ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=HexColor('#059669'),  # emerald-600
            spaceAfter=8,
            spaceBefore=16,
            fontName='Helvetica-Bold'
        )
        
        question_style = ParagraphStyle(
            'Question',
            parent=styles['Normal'],
            fontSize=11,
            textColor=HexColor('#374151'),  # gray-700
            spaceAfter=4,
            leftIndent=10,
            fontName='Helvetica'
        )
        
        passage_style = ParagraphStyle(
            'Passage',
            parent=styles['Normal'],
            fontSize=11,
            textColor=HexColor('#1f2937'),
            spaceAfter=8,
            alignment=TA_JUSTIFY,
            leading=14,
            fontName='Helvetica'
        )
        
        # Header
        story.append(Paragraph(worksheet_data.get('title', 'Worksheet'), title_style))
        
        subtitle_parts = []
        if worksheet_data.get('subtitle'):
            subtitle_parts.append(worksheet_data['subtitle'])
        if worksheet_data.get('grade_level'):
            subtitle_parts.append(worksheet_data['grade_level'])
        if worksheet_data.get('subject'):
            subtitle_parts.append(worksheet_data['subject'])
        
        if subtitle_parts:
            story.append(Paragraph(' • '.join(subtitle_parts), subtitle_style))
        
        # Instructions box
        if worksheet_data.get('instructions'):
            instructions_text = f"<b>Instructions:</b> {worksheet_data['instructions']}"
            if worksheet_data.get('estimated_time'):
                instructions_text += f" <i>(Estimated time: {worksheet_data['estimated_time']})</i>"
            story.append(Paragraph(instructions_text, instructions_style))
        
        story.append(Spacer(1, 0.2*inch))
        
        # Process sections
        sections = worksheet_data.get('sections', [])
        for section_idx, section in enumerate(sections):
            section_type = section.get('type', 'short_answer')
            image_key = f'section_{section_idx}'
            image_data = images.get(image_key)
            
            print(f"   Creating section {section_idx+1}/{len(sections)}: {section_type}")
            
            # Section elements (to keep together when possible)
            section_elements = []
            
            # Section title
            section_elements.append(Paragraph(section.get('title', f'Section {section_idx+1}'), section_title_style))
            
            # Section-specific instructions
            if section.get('instructions'):
                section_elements.append(Paragraph(f"<i>{section['instructions']}</i>", instructions_style))
                section_elements.append(Spacer(1, 0.1*inch))
            
            # Render based on type
            if section_type == 'practice_mastery':
                section_elements.extend(self._render_practice_mastery(section, question_style))
            
            elif section_type == 'instructional_reading':
                section_elements.extend(self._render_instructional_reading(section, passage_style, question_style, image_data))
            
            elif section_type == 'diagram_labeling':
                section_elements.extend(self._render_diagram_labeling(section, question_style, image_data))
            
            elif section_type == 'matching':
                section_elements.extend(self._render_matching(section, question_style))
            
            elif section_type == 'fill_in_blank':
                section_elements.extend(self._render_fill_in_blank(section, question_style))
            
            elif section_type == 'short_answer':
                section_elements.extend(self._render_short_answer(section, question_style))
            
            elif section_type == 'creative_writing':
                section_elements.extend(self._render_creative_writing(section, passage_style, image_data))
            
            elif section_type == 'visual_tracing':
                section_elements.extend(self._render_visual_tracing(section, question_style, image_data))
            
            else:
                # Default rendering
                section_elements.extend(self._render_short_answer(section, question_style))
            
            # Add image if available and not already added
            if image_data and section_type not in ['instructional_reading', 'diagram_labeling', 'creative_writing', 'visual_tracing']:
                img_stream = self._base64_to_stream(image_data)
                if img_stream:
                    try:
                        img = RLImage(img_stream, width=4*inch, height=3*inch)
                        section_elements.append(Spacer(1, 0.1*inch))
                        section_elements.append(img)
                        print(f"      ✅ Image added to section")
                    except Exception as e:
                        print(f"      ⚠️  Could not add image: {e}")
            
            # Try to keep section together, but allow page break if needed
            try:
                story.append(KeepTogether(section_elements))
            except:
                story.extend(section_elements)
            
            # Add space between sections
            if section_idx < len(sections) - 1:
                story.append(Spacer(1, 0.3*inch))
        
        # Build PDF
        doc.build(story)
        pdf_buffer.seek(0)
        
        return pdf_buffer
    
    # Section renderers
    
    def _render_practice_mastery(self, section: Dict, question_style) -> List:
        """Render practice/mastery worksheet items"""
        elements = []
        items = section.get('items', [])
        
        for idx, item in enumerate(items):
            question_text = f"{idx + 1}. {item.get('question', '')}"
            elements.append(Paragraph(question_text, question_style))
            
            # Add answer space based on size
            answer_space = item.get('answer_space', 'small')
            space_map = {'small': 0.3, 'medium': 0.5, 'large': 0.8}
            elements.append(Spacer(1, space_map.get(answer_space, 0.3)*inch))
        
        return elements
    
    def _render_instructional_reading(self, section: Dict, passage_style, question_style, image_data) -> List:
        """Render reading comprehension section"""
        elements = []
        
        # Add image first if available
        if image_data:
            img_stream = self._base64_to_stream(image_data)
            if img_stream:
                try:
                    img = RLImage(img_stream, width=5*inch, height=3*inch)
                    elements.append(img)
                    elements.append(Spacer(1, 0.15*inch))
                    print(f"      ✅ Image added to reading section")
                except Exception as e:
                    print(f"      ⚠️  Could not add image: {e}")
        
        # Add passage
        passage = section.get('passage', '')
        if passage:
            # Split into paragraphs
            paragraphs = passage.split('\n\n') if '\n\n' in passage else [passage]
            for para in paragraphs:
                if para.strip():
                    elements.append(Paragraph(para.strip(), passage_style))
                    elements.append(Spacer(1, 0.1*inch))
        
        elements.append(Spacer(1, 0.2*inch))
        
        # Add questions
        questions = section.get('questions', [])
        for idx, q in enumerate(questions):
            question_text = f"{idx + 1}. {q.get('question', '')}"
            if q.get('points'):
                question_text += f" <i>({q['points']} points)</i>"
            elements.append(Paragraph(question_text, question_style))
            elements.append(Spacer(1, 0.5*inch))
        
        return elements
    
    def _render_diagram_labeling(self, section: Dict, question_style, image_data) -> List:
        """Render diagram labeling section"""
        elements = []
        
        # Add diagram image
        if image_data:
            img_stream = self._base64_to_stream(image_data)
            if img_stream:
                try:
                    img = RLImage(img_stream, width=5.5*inch, height=4*inch)
                    elements.append(img)
                    elements.append(Spacer(1, 0.15*inch))
                    print(f"      ✅ Diagram image added")
                except Exception as e:
                    print(f"      ⚠️  Could not add diagram: {e}")
        
        # Add label blanks
        labels = section.get('labels', [])
        if labels:
            elements.append(Paragraph("<b>Labels to use:</b>", question_style))
            elements.append(Spacer(1, 0.05*inch))
            
            # Create table for labels
            label_data = []
            row = []
            for idx, label in enumerate(labels):
                row.append(f"{idx + 1}. _____________")
                if len(row) == 3:
                    label_data.append(row)
                    row = []
            if row:
                label_data.append(row)
            
            if label_data:
                table = Table(label_data, colWidths=[2.2*inch]*3)
                table.setStyle(TableStyle([
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ]))
                elements.append(table)
        
        return elements
    
    def _render_matching(self, section: Dict, question_style) -> List:
        """Render matching section"""
        elements = []
        
        column_a = section.get('column_a', [])
        column_b = section.get('column_b', [])
        
        # Create matching table
        table_data = [['Column A', '', 'Column B']]
        
        max_len = max(len(column_a), len(column_b))
        for i in range(max_len):
            item_a = f"{i + 1}. {column_a[i]}" if i < len(column_a) else ""
            item_b = f"{chr(65 + i)}. {column_b[i]}" if i < len(column_b) else ""
            table_data.append([item_a, "____", item_b])
        
        table = Table(table_data, colWidths=[2.5*inch, 0.5*inch, 2.5*inch])
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('ALIGN', (1, 1), (1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(table)
        
        return elements
    
    def _render_fill_in_blank(self, section: Dict, question_style) -> List:
        """Render fill in the blank section"""
        elements = []
        items = section.get('items', [])
        
        for idx, item in enumerate(items):
            question = item.get('question', '')
            # Replace underscores with longer blanks for better visibility
            question = question.replace('____', '_' * 20)
            question = question.replace('___', '_' * 15)
            question = question.replace('__', '_' * 10)
            
            question_text = f"{idx + 1}. {question}"
            elements.append(Paragraph(question_text, question_style))
            elements.append(Spacer(1, 0.15*inch))
        
        return elements
    
    def _render_short_answer(self, section: Dict, question_style) -> List:
        """Render short answer section"""
        elements = []
        items = section.get('items', [])
        
        for idx, item in enumerate(items):
            question_text = f"{idx + 1}. {item.get('question', '')}"
            if item.get('points'):
                question_text += f" <i>({item['points']} points)</i>"
            
            elements.append(Paragraph(question_text, question_style))
            
            # Add answer lines
            answer_space = item.get('answer_space', 'medium')
            space_map = {'small': 0.4, 'medium': 0.7, 'large': 1.0}
            elements.append(Spacer(1, space_map.get(answer_space, 0.7)*inch))
        
        return elements
    
    def _render_creative_writing(self, section: Dict, passage_style, image_data) -> List:
        """Render creative writing section"""
        elements = []
        
        # Add inspiring image
        if image_data:
            img_stream = self._base64_to_stream(image_data)
            if img_stream:
                try:
                    img = RLImage(img_stream, width=5*inch, height=3*inch)
                    elements.append(img)
                    elements.append(Spacer(1, 0.15*inch))
                    print(f"      ✅ Image added to writing prompt")
                except Exception as e:
                    print(f"      ⚠️  Could not add image: {e}")
        
        # Add prompt
        prompt = section.get('prompt', '')
        if prompt:
            elements.append(Paragraph(f"<b>Prompt:</b> {prompt}", passage_style))
            elements.append(Spacer(1, 0.2*inch))
        
        # Add writing lines
        num_lines = section.get('lines', 15)
        for _ in range(num_lines):
            elements.append(Paragraph("_" * 100, passage_style))
            elements.append(Spacer(1, 0.15*inch))
        
        return elements
    
    def _render_visual_tracing(self, section: Dict, question_style, image_data) -> List:
        """Render visual/tracing section for young learners"""
        elements = []
        
        # Add visual elements
        if image_data:
            img_stream = self._base64_to_stream(image_data)
            if img_stream:
                try:
                    img = RLImage(img_stream, width=5.5*inch, height=4*inch)
                    elements.append(img)
                    elements.append(Spacer(1, 0.15*inch))
                    print(f"      ✅ Visual image added")
                except Exception as e:
                    print(f"      ⚠️  Could not add image: {e}")
        
        # Add tracing/matching items
        items = section.get('items', [])
        for idx, item in enumerate(items):
            question_text = f"{idx + 1}. {item.get('question', '')}"
            elements.append(Paragraph(question_text, question_style))
            elements.append(Spacer(1, 0.4*inch))
        
        return elements
    
    def _base64_to_stream(self, base64_data: str) -> Optional[io.BytesIO]:
        """Convert base64 image data to BytesIO stream"""
        try:
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]
            image_bytes = base64.b64decode(base64_data)
            return io.BytesIO(image_bytes)
        except Exception as e:
            print(f"Error converting base64 to stream: {e}")
            return None
