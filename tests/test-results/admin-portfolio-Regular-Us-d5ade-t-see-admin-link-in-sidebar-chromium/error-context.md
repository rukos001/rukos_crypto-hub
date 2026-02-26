# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]:
          - img [ref=e8]
          - heading "RUKOS_CRYPTO | HUB" [level=1] [ref=e11]
        - paragraph [ref=e12]: Криптовалютный хаб для трейдеров
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]: Авторизация
          - generic [ref=e16]: Войдите или создайте аккаунт
        - generic [ref=e18]:
          - tablist [ref=e19]:
            - tab "Вход" [selected] [ref=e20] [cursor=pointer]
            - tab "Регистрация" [ref=e21] [cursor=pointer]
          - tabpanel "Вход" [ref=e22]:
            - generic [ref=e23]:
              - generic [ref=e24]:
                - text: Email
                - textbox "Email" [active] [ref=e25]:
                  - /placeholder: your@email.com
                  - text: test@test.com
              - generic [ref=e26]:
                - text: Пароль
                - textbox "Пароль" [ref=e27]:
                  - /placeholder: ••••••••
              - button "Войти" [ref=e28] [cursor=pointer]
    - region "Notifications alt+T"
  - link "Made with Emergent" [ref=e29] [cursor=pointer]:
    - /url: https://app.emergent.sh/?utm_source=emergent-badge
    - img [ref=e30]
    - paragraph [ref=e33]: Made with Emergent
```