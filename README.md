# Barbearia — agendamento com WhatsApp e controle de faltas

App mobile-first em Expo (SDK 58, Expo Router). Por enquanto os dados ficam salvos no aparelho (AsyncStorage); o backend vem depois.

## Como rodar

```bash
npm install
npx expo start
```

Escaneie o QR code com o app **Expo Go** no celular. Para ver no navegador: `npm run web`.

## Ligar ao seu projeto EAS

O `eas init` precisa do seu login na Expo, então rode na sua máquina:

```bash
npm install --global eas-cli
eas login
eas init --id 06e2a8d1-5f2e-455e-bc9c-b3902a2a57a5
```

Isso grava o `projectId` no `app.json`. Depois, para gerar um APK de teste: `eas build -p android --profile preview`.

## O que já funciona

- **Agenda**: dias em faixa horizontal, resumo do dia (horários, confirmados, faturamento previsto) e aviso de horários que já passaram sem marcar presença.
- **Novo agendamento**: busca ou cadastro rápido de cliente, serviço, dia e grade de horários que bloqueia conflitos pela duração do serviço.
- **WhatsApp**: botões de confirmação e lembrete que abrem o WhatsApp com a mensagem pronta (modelos editáveis em Ajustes).
- **Controle de faltas**: marcar compareceu/faltou/cancelado; o cliente que passa do limite de faltas recebe alerta ("pedir sinal") na agenda, no agendamento e na ficha.
- **Clientes**: busca, filtro de quem tem faltas, ficha com visitas, faltas, % de presença e histórico.
- **Ajustes**: nome da barbearia, horário de funcionamento, intervalo da grade, limite de faltas, serviços e mensagens.

## Estrutura

```
src/
  app/                    telas (Expo Router)
    (tabs)/index.tsx      Agenda
    (tabs)/clientes.tsx   Clientes
    (tabs)/ajustes.tsx    Ajustes
    agendamento/novo.tsx  Novo agendamento
    agendamento/[id].tsx  Detalhe + WhatsApp + presença/falta
    cliente/novo.tsx      Novo cliente
    cliente/[id].tsx      Ficha do cliente
  components/ui.tsx       botões, cards, chips, campos
  constants/theme.ts      cores e status
  lib/                    datas, horários livres, WhatsApp, diálogos
  store/                  estado global + AsyncStorage + dados de exemplo
  types.ts                Cliente, Servico, Agendamento, Config
```

## Próximos passos (backend)

1. Trocar o `store/store.tsx` por chamadas à API (Supabase ou Firebase), mantendo os mesmos tipos de `types.ts`.
2. Envio **automático** de confirmação e lembrete (ex.: 24h e 2h antes) pela API oficial do WhatsApp Business. Hoje o envio é manual: o app abre o WhatsApp com o texto pronto.
3. Login do barbeiro e mais de um profissional por barbearia.
4. Link público para o cliente agendar sozinho.
5. Sinal via Pix para clientes acima do limite de faltas.
