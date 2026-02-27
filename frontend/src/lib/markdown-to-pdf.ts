import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { lexer, type Token, type Tokens } from "marked";

const styles = {
  h1: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 8, marginTop: 12, color: "#111111" },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 6, marginTop: 10, color: "#111111" },
  h3: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 4, marginTop: 8, color: "#333333" },
  paragraph: { fontSize: 10, fontFamily: "Times-Roman", lineHeight: 1.6, marginBottom: 6, color: "#111111" },
  bold: { fontFamily: "Times-Bold" },
  italic: { fontFamily: "Times-Italic" },
  listItem: { fontSize: 10, fontFamily: "Times-Roman", lineHeight: 1.6, marginBottom: 3, color: "#111111" },
  bullet: { width: 16, fontSize: 10, fontFamily: "Times-Roman", color: "#111111" },
  listRow: { flexDirection: "row" as const, marginBottom: 3 },
  hr: { borderBottomWidth: 1, borderBottomColor: "#E5E5E5", marginTop: 10, marginBottom: 10 },
  codespan: { fontFamily: "Courier", fontSize: 9, color: "#333333" },
};

function renderInline(tokens: Token[]): React.ReactElement[] {
  return tokens.map((token, i) => {
    if (token.type === "strong") {
      return React.createElement(
        Text,
        { key: i, style: styles.bold },
        ...renderInline((token as Tokens.Strong).tokens)
      );
    }
    if (token.type === "em") {
      return React.createElement(
        Text,
        { key: i, style: styles.italic },
        ...renderInline((token as Tokens.Em).tokens)
      );
    }
    if (token.type === "codespan") {
      return React.createElement(Text, { key: i, style: styles.codespan }, (token as Tokens.Codespan).text);
    }
    if (token.type === "link") {
      const linkToken = token as Tokens.Link;
      return React.createElement(Text, { key: i }, ...renderInline(linkToken.tokens ?? []));
    }
    if (token.type === "br") {
      return React.createElement(Text, { key: i }, "\n");
    }
    if (token.type === "del") {
      return React.createElement(
        Text,
        { key: i },
        ...renderInline((token as Tokens.Del).tokens)
      );
    }
    const t = token as { text?: string; raw?: string };
    return React.createElement(Text, { key: i }, t.text ?? t.raw ?? "");
  });
}

function renderListItem(item: Tokens.ListItem, ordered: boolean, index: number): React.ReactElement {
  const bullet = ordered ? `${index + 1}.` : "•";
  const inlineTokens: Token[] = [];
  for (const t of item.tokens) {
    if (t.type === "text") {
      const textToken = t as Tokens.Text;
      if (Array.isArray(textToken.tokens) && textToken.tokens.length > 0) {
        inlineTokens.push(...textToken.tokens);
      } else {
        inlineTokens.push(t);
      }
    } else if (t.type === "paragraph") {
      const paraToken = t as Tokens.Paragraph;
      inlineTokens.push(...paraToken.tokens);
    }
    // Skip nested lists, code blocks, blockquotes — not present in NDA standard terms
  }
  return React.createElement(
    View,
    { key: index, style: styles.listRow },
    React.createElement(Text, { style: styles.bullet }, bullet),
    React.createElement(Text, { style: styles.listItem }, ...renderInline(inlineTokens))
  );
}

export function markdownToPdfElements(markdown: string): React.ReactElement[] {
  const tokens = lexer(markdown);
  const elements: React.ReactElement[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === "heading") {
      const t = token as Tokens.Heading;
      const style = t.depth === 1 ? styles.h1 : t.depth === 2 ? styles.h2 : styles.h3;
      elements.push(
        React.createElement(Text, { key: i, style }, ...renderInline(t.tokens))
      );
    } else if (token.type === "paragraph") {
      const t = token as Tokens.Paragraph;
      elements.push(
        React.createElement(Text, { key: i, style: styles.paragraph }, ...renderInline(t.tokens))
      );
    } else if (token.type === "list") {
      const t = token as Tokens.List;
      const listEl = React.createElement(
        View,
        { key: i, style: { marginBottom: 6 } },
        ...t.items.map((item, j) => renderListItem(item, t.ordered, j))
      );
      elements.push(listEl);
    } else if (token.type === "hr") {
      elements.push(React.createElement(View, { key: i, style: styles.hr }));
    } else if (token.type === "space") {
      elements.push(React.createElement(View, { key: i, style: { marginBottom: 4 } }));
    }
  }

  return elements;
}
