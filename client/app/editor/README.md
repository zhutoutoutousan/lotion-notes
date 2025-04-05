# Multi-Modal Editor

The Multi-Modal Editor is a powerful tool that allows you to transform your markdown notes into interactive visualizations. It provides three different views of your content:

1. **Markdown Editor**: Write and edit your notes in markdown format
2. **Knowledge Graph**: Visualize the relationships between concepts in your notes
3. **3D World**: Explore your knowledge in an immersive 3D environment

## How to Use

1. **Write in Markdown**: Use the editor tab to write your notes in markdown format. The editor supports standard markdown syntax including headings, lists, bold, italic, and more.

2. **Structure Your Knowledge**: Use headings to organize your content hierarchically:
   - `#` for main title
   - `##` for sections
   - `###` for subsections
   - `-` for list items

3. **Define Relationships**: Use special syntax to define relationships between concepts:
   - `- **Concept**: Description` - Defines a concept with a description
   - `- Concept A *relationship* Concept B` - Defines a relationship between concepts

4. **Preview Your Content**: Switch to the preview tab to see how your markdown will be rendered.

5. **Visualize as a Graph**: Click on the "Knowledge Graph" tab to see a 2D visualization of your knowledge structure.

6. **Explore in 3D**: Click on the "3D World" tab to explore your knowledge in an immersive 3D environment.

## Example

```markdown
# My Knowledge Base

## Concepts

### Language Learning
- **Vocabulary**: Words and phrases in a language
- **Grammar**: Rules for constructing sentences
- **Pronunciation**: How to speak words correctly

### Mathematics
- **Algebra**: Study of mathematical symbols and rules
- **Geometry**: Study of shapes and spaces
- **Calculus**: Study of continuous change

## Relationships
- Language Learning *requires* Vocabulary
- Language Learning *requires* Grammar
- Mathematics *includes* Algebra
- Mathematics *includes* Geometry
- Mathematics *includes* Calculus
```

## Features

- **Real-time Processing**: Your markdown is processed in real-time to generate the visualizations
- **Interactive Graph**: Zoom, pan, and click on nodes in the knowledge graph
- **Immersive 3D**: Navigate through your knowledge in a 3D space
- **Responsive Design**: Works on desktop and mobile devices

## Technical Details

The Multi-Modal Editor uses the following technologies:

- **React**: For the user interface
- **React Markdown**: For rendering markdown
- **React Force Graph**: For the 2D graph visualization
- **Three.js**: For the 3D visualization
- **IndexedDB**: For storing your notes locally 