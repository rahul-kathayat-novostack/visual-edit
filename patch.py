import re

with open('src/components/StyleEditorPanel.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    'import { X, AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline, Check, Undo, Image as ImageIcon, CloudUpload, Link2, Loader2, MousePointer2, Zap, MousePointerClick, Clock, ShieldAlert, CircleDashed, CircleDivide, Ban } from "lucide-react"',
    'import { X, AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline, Check, Undo, Image as ImageIcon, CloudUpload, Link2, Loader2, MousePointer2, Zap, MousePointerClick, Clock, ShieldAlert, CircleDashed, CircleDivide, Ban } from "lucide-react"\nimport { useEditorController } from "./EditorContext";\nimport { generateTailwindClasses, normalizeColor, rgbToHex, parseShadow, mapJustify, mapAlign, mapFlexDir, parseInteraction } from "../core/ClassNameEngine";\nimport type { StylesState, StyleEditorPanelHandle } from "../core/types";'
)

# 2. Remove Types
content = re.sub(r'type StylesState = \{.*?\};\n\nexport type StyleEditorPanelHandle = \{.*?\};\n', '', content, flags=re.DOTALL)

# 3. Add controller to component
content = content.replace(
    'export default React.forwardRef<StyleEditorPanelHandle, StyleEditorPanelProps>(function StyleEditorPanel({ selectedElement, onUpdate, onClose }, ref) {\n    const [pendingStyles, setPendingStyles] = useState<StylesState>({',
    'export default React.forwardRef<StyleEditorPanelHandle, StyleEditorPanelProps>(function StyleEditorPanel({ selectedElement, onUpdate, onClose }, ref) {\n    const controller = useEditorController();\n    const [pendingStyles, setPendingStyles] = useState<StylesState>({'
)

# 4. Remove local normalizeColor
content = re.sub(r'    // Normalize color values to lowercase 6-digit hex\n    const normalizeColor = \(color: string\): string => \{.*?    \};\n\n', '', content, flags=re.DOTALL)

# 5. Replace inside useEffect
# Remove rgbToHex, parseShadow, mapJustify, mapAlign, mapFlexDir, parseInteraction inside useEffect
content = re.sub(r'            const rgbToHex = \(rgb: string\) => \{.*?            \};\n\n', '', content, flags=re.DOTALL)
content = re.sub(r'            const parseShadow = \(shadow: string\) => \{.*?            \};\n\n', '', content, flags=re.DOTALL)
content = re.sub(r'            const mapJustify = \(val: string\) => \{.*?            \};\n\n', '', content, flags=re.DOTALL)
content = re.sub(r'            const mapAlign = \(val: string\) => \{.*?            \};\n\n', '', content, flags=re.DOTALL)
content = re.sub(r'            const mapFlexDir = \(val: string\) => \{.*?            \};\n\n', '', content, flags=re.DOTALL)
content = re.sub(r'            const parseInteraction = \(prefix: string, property: string\) => \{.*?            \};\n\n', '', content, flags=re.DOTALL)

# 6. Replace fetch inside handleOnPageBlur
fetch_str = """                                        const res = await fetch('/api/edit-source', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                filePath, line, column,
                                                newValue: textContent,
                                                type: 'text',
                                            }),
                                        });"""
replacement_str = """                                        await controller.applyTextEdit(selectedElement, textContent, textContent);"""
content = content.replace(fetch_str, replacement_str)

fetch_str_2 = """                                        await fetch('/api/edit-source', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                filePath, line, column,
                                                newValue: selectedElement.innerText,
                                                type: 'text',
                                            }),
                                        });"""
replacement_str_2 = """                                        await controller.applyTextEdit(selectedElement, selectedElement.innerText, textContent);"""
content = content.replace(fetch_str_2, replacement_str_2)

# 7. Replace fetch in handleFileUpload
upload_fetch = """            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.url) {"""
upload_replacement = """            const url = await controller.uploadImage(file);
            if (url) {"""
content = content.replace(upload_fetch, upload_replacement)
content = content.replace('data.url', 'url')

# 8. Remove local generateTailwindClasses
content = re.sub(r'    const generateTailwindClasses = \(currentClass: string, s: StylesState\) => \{.*?    \};\n\n    if \(!selectedElement\)', '    if (!selectedElement)', content, flags=re.DOTALL)

with open('visual-editor/ui/StyleEditorPanel.tsx', 'w') as f:
    f.write(content)
