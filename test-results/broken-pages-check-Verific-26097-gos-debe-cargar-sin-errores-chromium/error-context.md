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
    - generic [ref=e26] [cursor=pointer]:
        - button "Open Next.js Dev Tools" [ref=e27]:
            - img [ref=e28]
        - generic [ref=e31]:
            - button "Open issues overlay" [ref=e32]:
                - generic [ref=e33]:
                    - generic [ref=e34]: '1'
                    - generic [ref=e35]: '2'
                - generic [ref=e36]:
                    - text: Issue
                    - generic [ref=e37]: s
            - button "Collapse issues badge" [ref=e38]:
                - img [ref=e39]
    - alert [ref=e41]
```
