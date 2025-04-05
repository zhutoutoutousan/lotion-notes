declare module 'react-syntax-highlighter' {
  import { ReactNode } from 'react';

  interface SyntaxHighlighterProps {
    children: string;
    language?: string;
    style?: any;
    customStyle?: any;
    className?: string;
    PreTag?: keyof JSX.IntrinsicElements;
    [key: string]: any;
  }

  export const Prism: React.FC<SyntaxHighlighterProps>;
  export const Light: React.FC<SyntaxHighlighterProps>;
  export default React.FC<SyntaxHighlighterProps>;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  const vscDarkPlus: any;
  export { vscDarkPlus };
} 