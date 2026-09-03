# Plano: Animção de Divisão Celular - Inspirada na Referência HTML

## Análise da Animação de Referência

A animação HTML mostra dois Conceitos-Chave:

### Fases da Animação (5 segundos, loop infinito)
1. **0-20% (Crescimento)**: Célula esquerda cresce 15% (`scale(1.15)`), célula direita emerge do centro (`scale(0)` → `scale(0.5)`)
2. **20-40% (Deformação/Fissura)**: Células se separam com deformação orgânica (`scaleX(1.3) scaleY(0.9)`, `border-radius` assimétrico)
3. **40-60% (Separação)**: Células se afastam 45px cada, `scale(0.9)`
4. **60-85% (Estabilização)**: Células crescem para `scale(1)`, posição final
5. **85-94% (Fade out)**: Opacidade vai para 0

### Conceitos Visuais Chave
1. **Origem Interna**: A célula-filha emerge DE DENTRO da célula-mãe (ambas começam no mesmo ponto)
2. **Crescimento**: A célula-mãe cresce antes de dividir
3. **Deformação Orgânica**: `scaleX(1.3) scaleY(0.9)` + `border-radius` assimétrico durante a separação
4. **Separação Espelhada**: Célula esquerda vai para esquerda, célula direita vai para direita

## Estado Atual vs Desejado

### Estado Atual (após minhas alterações)
- Layout: `[Input2] [Bridge] [Input1]`
- Input2: Expande de 0% a 48% na ESQUERDA
- Input1: Encolhe de 100% a 48% na DIREITA
- **Problema**: Input2 parece "deslizar da borda esquerda", não "emergir de dentro do Input1"

### Estado Desejado (baseado na referência)
- Input1: Começa no centro (100% largura), encolhe levemente para a DIREITA
- Input2: Emerge DE DENTRO do Input1 (começa pequeno, cresce para tamanho cheio)
- Input2: Desliza para a ESQUERDA enquanto cresce
- **Efeito visual**: Parece que Input1 está se dividindo/multiplicando

## Plano de Implementação Detalhado

### Arquivo: `/workspaces/N/components/CellDivisionContainer.tsx`

#### 1. Adicionar Nova Fase de Animação: `'growing'`
```typescript
type Phase = 'idle' | 'growing' | 'sliding' | 'split' | 'merging' | 'merged';
```

**Timing atualizado:**
- `idle` → `growing`: 0ms (início imediato)
- `growing` → `sliding`: 200ms (fase de crescimento)
- `sliding` → `split`: 700ms (fase de separação)
- Total: 900ms (mantido)

**Valores durante `growing`:**
- Input1: `scale(1.03)` (cresce 3%)
- Input2: `scale(0.5)` e `opacity(1)` (emerge do nada)
- Bridge: `width(0)` (ainda invisível)

#### 2. Mudar Para Posicionamento Absoluto Durante Animação

**Estrutura do Container:**
```jsx
<div className="relative w-full" style={{ perspective: '800px' }}>
  <div 
    className="relative" 
    style={{ minHeight: '72px' }}
  >
    {/* Input2 - Posicionado absolutamente durante animação */}
    <motion.div
      style={{
        position: isIdle ? 'relative' : 'absolute',
        width: isIdle ? 'auto' : '48%',
        left: isIdle ? 'auto' : 0,
        top: 0,
        bottom: 0,
      }}
    >
      {secondChild}
    </motion.div>

    {/* Bridge - Posicionado absolutamente durante animação */}
    <motion.div
      style={{
        position: isIdle ? 'relative' : 'absolute',
        left: isIdle ? 'auto' : '48%',
        width: bridgeWidth,
      }}
    />

    {/* Input1 - Posicionado absolutamente durante animação */}
    <motion.div
      style={{
        position: isIdle ? 'relative' : 'absolute',
        width: isIdle ? '100%' : '48%',
        right: isIdle ? 'auto' : 0,
        top: 0,
        bottom: 0,
      }}
    >
      {firstChild}
    </motion.div>
  </div>
</div>
```

#### 3. Animação de Scale Detalhada

**Input2 (célula-filha):**
```typescript
// Fases de scale
scale: isGrowing ? 0.5 : isSliding ? 1 : isSplit ? 1 : 0

// Transições
transition={{
  scale: { 
    type: 'spring', 
    stiffness: isGrowing ? 300 : 200, 
    damping: isGrowing ? 20 : 25,
    delay: isGrowing ? 0 : 0.1
  }
}}
```

**Input1 (célula-mãe):**
```typescript
// Fases de scale
scale: isGrowing ? 1.03 : isSliding ? 1 : isSplit ? 1 : 1

// Transições
transition={{
  scale: { 
    type: 'spring', 
    stiffness: 400, 
    damping: 25 
  }
}}
```

#### 4. Deformação Orgânica Durante Separação

**Input2 (durante sliding):**
```typescript
scaleX: isSliding ? 1.02 : 1,
scaleY: isSliding ? 0.98 : 1,
```

**Input1 (durante sliding):**
```typescript
scaleX: isSliding ? 1.02 : 1,
scaleY: isSliding ? 0.98 : 1,
```

**Timing:** A deformação acontece nos primeiros 300ms da fase `sliding`, depois retorna ao normal.

#### 5. Clip-Path para Emergência do Centro

**Input2 (clip-path):**
```typescript
// Durante growing: emerge do centro
clipPath: isGrowing 
  ? 'inset(0 50% 0 50%)' 
  : 'inset(0 0 0 0)'

// Transição
transition={{
  clipPath: { 
    duration: 0.4, 
    ease: [0.32, 0.72, 0, 1] 
  }
}}
```

#### 6. Posições Finais (Após Split)

**Estado `split`:**
- Input2: `left: 0`, `width: 48%`, `scale(1)`
- Bridge: `left: 48%`, `width: 0` (sumiu)
- Input1: `right: 0`, `width: 48%`, `scale(1)`

**Estado `idle`:**
- Input2: `position: relative`, `width: 0%`, `opacity: 0`
- Bridge: `position: relative`, `width: 0`
- Input1: `position: relative`, `width: 100%`

#### 7. Animação de Merge (Voltar para Single)

**Timing:**
- `split` → `merging`: 0ms
- `merging` → `merged`: 650ms
- `merged` → `idle`: 700ms

**Animação inversa:**
- Input2: `scale(1)` → `scale(0.5)` → `scale(0)` e `opacity(0)`
- Input1: `scale(1)` → `scale(1.03)` → `scale(1)`
- Positions: Voltam para layout flex

#### 8. Ajuste do Bridge

**Durante `growing`:**
- `width: 0` (invisível)
- `opacity: 0`

**Durante `sliding`:**
- `width: 60px`
- `opacity: 1`
- Posição: `left: 48%` (entre os dois inputs)

**Durante `split`:**
- `width: 0` (sumiu)
- `opacity: 0`

## Resumo das Mudanças por Fase

| Fase | Input1 | Input2 | Bridge | Visual |
|------|--------|--------|--------|--------|
| `idle` | flex: 100%, scale(1) | width: 0, opacity: 0, scale(0) | width: 0 | Input1 cheio |
| `growing` | absolute, 48% direita, scale(1.03) | absolute, 48% esquerda, scale(0.5), clip centro | width: 0 | Input1 cresce, Input2 emerge do centro |
| `sliding` | absolute, 48% direita, scale(1), deformação | absolute, 48% esquerda, scale(1), deformação | width: 60px | Separação com deformação |
| `split` | absolute, 48% direita, scale(1) | absolute, 48% esquerda, scale(1) | width: 0 | Dois inputs lado a lado |
| `merging` | absolute→relative, 100%, scale(1.03) | absolute, 48% esquerda, scale(0.5), opacity(0.8) | width: 50px | Inputs se fundem |
| `merged` | relative, 100%, scale(1) | relative, 0%, scale(0), opacity(0) | width: 0 | Voltou ao estado inicial |

## Verificação
1. Rodar `npm run dev` e testar a animação
2. Verificar que Input2 parece emergir de dentro do Input1 (scale de 0.5 para 1)
3. Verificar que Input1 cresce levemente antes de dividir (scale 1.03)
4. Verificar a deformação sutil durante a separação
5. Verificar que a animação de merge (voltar para single) ainda funciona
6. Verificar todas as 3 instâncias do CellDivisionContainer no page.tsx
7. Verificar responsividade em diferentes tamanhos de tela
