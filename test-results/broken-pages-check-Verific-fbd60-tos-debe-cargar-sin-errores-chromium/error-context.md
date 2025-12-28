# Page snapshot

```yaml
- generic [active] [ref=e1]:
    - link "Saltar al contenido principal" [ref=e2] [cursor=pointer]:
        - /url: '#main-content'
    - generic [ref=e4]:
        - generic [ref=e5]:
            - generic [ref=e6]:
                - img [ref=e7]
                - heading "Algo salió mal" [level=3] [ref=e9]
            - generic [ref=e10]: Se ha producido un error inesperado en la aplicación.
        - generic [ref=e11]:
            - paragraph [ref=e13]: 'Objects are not valid as a React child (found: object with keys {$$typeof, render}). If you meant to render a collection of children, use an array instead.'
            - generic [ref=e14]:
                - button "Intentar de nuevo" [ref=e15] [cursor=pointer]:
                    - img [ref=e16]
                    - text: Intentar de nuevo
                - button "Ir al Dashboard" [ref=e21] [cursor=pointer]
    - button "Open Next.js Dev Tools" [ref=e27] [cursor=pointer]:
        - img [ref=e28]
    - alert [ref=e31]
```
