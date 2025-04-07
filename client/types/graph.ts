export interface Node {
  id: string;
  label: string;
  type?: string;
  content?: string;
  position?: [number, number, number];
  color?: string;
  size?: number;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  color?: string;
  width?: number;
} 