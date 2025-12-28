# Page snapshot

```yaml
- generic [active] [ref=e1]:
    - link "Saltar al contenido principal" [ref=e2] [cursor=pointer]:
        - /url: '#main-content'
    - generic [ref=e5]:
        - img [ref=e8]
        - generic [ref=e10]:
            - heading "¡Ups! Algo salió mal" [level=1] [ref=e11]
            - paragraph [ref=e12]: Ha ocurrido un error inesperado. No te preocupes, nuestro equipo ha sido notificado.
        - generic [ref=e13]:
            - paragraph [ref=e14]: 'Detalles del error (solo en desarrollo):'
            - generic [ref=e15]: 'Objects are not valid as a React child (found: object with keys {$$typeof, render}). If you meant to render a collection of children, use an array instead.'
            - group [ref=e16]:
                - generic "Ver stack trace" [ref=e17] [cursor=pointer]
        - generic [ref=e18]:
            - button "Intentar de nuevo" [ref=e19] [cursor=pointer]:
                - img [ref=e20]
                - text: Intentar de nuevo
            - generic [ref=e25]:
                - button "Ir al inicio" [ref=e26] [cursor=pointer]:
                    - img [ref=e27]
                    - text: Ir al inicio
                - button "Soporte" [ref=e30] [cursor=pointer]:
                    - img [ref=e31]
                    - text: Soporte
        - paragraph [ref=e35]:
            - text: Si este problema persiste, por favor
            - link "contacta con soporte técnico" [ref=e36] [cursor=pointer]:
                - /url: /soporte
    - button "Open Next.js Dev Tools" [ref=e42] [cursor=pointer]:
        - img [ref=e43]
    - alert [ref=e46]
```
