/**
 * Markdown Parser Utility
 * 
 * This utility converts markdown text into a graph structure
 * that can be visualized in both 2D and 3D.
 */

export interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    description?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    label?: string;
  }>;
}

/**
 * Parse markdown text into a graph structure
 * 
 * @param markdown The markdown text to parse
 * @returns A graph structure with nodes and edges
 */
export function parseMarkdownToGraph(markdown: string): GraphData {
  if (!markdown) {
    return { nodes: [], edges: [] };
  }

  const lines = markdown.split('\n');
  const nodes: GraphData['nodes'] = [];
  const edges: GraphData['edges'] = [];
  
  // Track hierarchy for creating edges
  const hierarchy: { id: string; level: number }[] = [];
  
  // Process each line
  lines.forEach((line, index) => {
    // Skip empty lines
    if (!line.trim()) return;
    
    // Check for headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = `heading-${index}`;
      
      // Add node
      nodes.push({
        id,
        label: text,
        type: level === 1 ? 'heading' : 'subheading',
      });
      
      // Update hierarchy
      while (hierarchy.length > 0 && hierarchy[hierarchy.length - 1].level >= level) {
        hierarchy.pop();
      }
      
      hierarchy.push({ id, level });
      
      // Create edge to parent if exists
      if (hierarchy.length > 1) {
        edges.push({
          source: hierarchy[hierarchy.length - 2].id,
          target: id,
          label: 'contains',
        });
      }
      
      return;
    }
    
    // Check for list items
    const listMatch = line.match(/^(\s*)[*+-]\s+(.+)$/);
    if (listMatch) {
      const indent = listMatch[1].length;
      const text = listMatch[2].trim();
      const id = `listitem-${index}`;
      
      // Add node
      nodes.push({
        id,
        label: text,
        type: 'listitem',
      });
      
      // Find parent based on indentation
      let parentId = '';
      
      if (hierarchy.length > 0) {
        // If we have a heading, connect to it
        parentId = hierarchy[hierarchy.length - 1].id;
      } else if (nodes.length > 1) {
        // Otherwise connect to the previous list item or create a list container
        const prevNode = nodes[nodes.length - 2];
        if (prevNode.type === 'listitem') {
          parentId = prevNode.id;
        } else {
          // Create a list container
          const listId = `list-${index}`;
          nodes.push({
            id: listId,
            label: 'List',
            type: 'list',
          });
          parentId = listId;
        }
      }
      
      if (parentId) {
        edges.push({
          source: parentId,
          target: id,
          label: 'contains',
        });
      }
      
      return;
    }
    
    // Regular paragraph
    if (line.trim()) {
      const id = `paragraph-${index}`;
      
      // Add node
      nodes.push({
        id,
        label: line.trim().substring(0, 30) + (line.length > 30 ? '...' : ''),
        type: 'paragraph',
        description: line.trim(),
      });
      
      // Connect to parent if exists
      if (hierarchy.length > 0) {
        edges.push({
          source: hierarchy[hierarchy.length - 1].id,
          target: id,
          label: 'contains',
        });
      }
    }
  });
  
  return { nodes, edges };
} 