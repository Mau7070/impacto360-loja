# COMANDO PARA CODEX - AUTO-START WINDOWS DO SHOPPING IMPACTO 360

Voce e um engenheiro senior de automacao Windows + Node.js. Configure o projeto para iniciar automaticamente o servidor local toda vez que o usuario entrar no Windows, deixando os robos do Shopping Impacto 360 disponiveis sem abertura manual.

## Contexto

- O projeto e React + Vite.
- O servidor local deve rodar com `npm run dev`.
- A porta fixa deve ser `5173`.
- O endereco principal deve ser `http://localhost:5173`.
- O `package.json` deve manter o script `"dev": "vite"`.
- A automacao deve abrir o navegador somente depois que a sessao do usuario estiver ativa.

## Tarefa principal

Criar automacao profissional usando Agendador de Tarefas do Windows, com execucao no logon do usuario atual e atraso de 30 segundos.

Crie os seguintes arquivos na raiz do projeto:

1. `INICIAR-IMPACTO360-AUTOMATICO.ps1`
2. `INSTALAR-AUTO-START-IMPACTO360.ps1`
3. `REMOVER-AUTO-START-IMPACTO360.ps1`
4. `VERIFICAR-STATUS-IMPACTO360.ps1`
5. `INSTALAR-AUTO-START-IMPACTO360.bat`
6. `INICIAR-AGORA-IMPACTO360.bat`
7. `REMOVER-AUTO-START-IMPACTO360.bat`
8. `VERIFICAR-STATUS-IMPACTO360.bat`

## Requisitos dos scripts

### INICIAR-IMPACTO360-AUTOMATICO.ps1

- Detectar automaticamente a pasta onde o script esta.
- Entrar na pasta do projeto.
- Verificar se Node.js esta instalado.
- Verificar se npm esta instalado.
- Verificar se `package.json` existe antes de rodar `npm run dev`.
- Se `node_modules` nao existir, executar `npm install`.
- Verificar se a porta 5173 ja esta ocupada.
- Se estiver ocupada por processo antigo do Node/Vite, encerrar somente esse processo.
- Se a porta estiver ocupada por outro programa, avisar e nao matar o processo.
- Iniciar o servidor com `npm run dev -- --host 127.0.0.1 --port 5173`.
- Salvar logs em `logs/servidor-impacto360.log` e `logs/erro-impacto360.log`.
- Aguardar o servidor responder em `http://localhost:5173`.
- Abrir automaticamente o navegador.
- Nao fechar o servidor depois de abrir o navegador.

### INSTALAR-AUTO-START-IMPACTO360.ps1

- Criar a tarefa `Impacto360 - Iniciar Servidor dos Robos`.
- Executar no logon do usuario atual.
- Aguardar 30 segundos apos o logon.
- Executar `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "CAMINHO_DO_PROJETO\INICIAR-IMPACTO360-AUTOMATICO.ps1"`.
- Se a tarefa ja existir, remover e recriar.
- Permitir execucao na bateria.
- Reiniciar em caso de falha.

### REMOVER-AUTO-START-IMPACTO360.ps1

- Remover a tarefa agendada `Impacto360 - Iniciar Servidor dos Robos`.
- Exibir confirmacao clara.

### VERIFICAR-STATUS-IMPACTO360.ps1

- Verificar se a tarefa agendada existe.
- Verificar se a porta 5173 esta em uso.
- Verificar se existe processo `node.exe` rodando.
- Testar se `http://localhost:5173` responde.
- Mostrar diagnostico: `ATIVO`, `DESLIGADO`, `ERRO`, `NODE NAO INSTALADO` ou `PORTA OCUPADA`.

## Regras importantes

- Nao alterar `package.json` sem necessidade.
- Nao quebrar o `npm run dev` existente.
- Usar sempre a porta 5173.
- Nao exigir login em Mercado Livre, WhatsApp ou plataforma externa.
- Nao expor botao administrativo ao publico.
- Nao remover robos existentes.
- Nao apagar arquivos do projeto.
- Nao criar dependencia de servico pago.
- Funcionar em Windows 10 e Windows 11.
- Mensagens do terminal em portugues simples.

## Comandos finais para o usuario

Instalar o auto-start uma unica vez:

```bat
INSTALAR-AUTO-START-IMPACTO360.bat
```

Iniciar agora, sem reiniciar:

```bat
INICIAR-AGORA-IMPACTO360.bat
```

Verificar estado:

```bat
VERIFICAR-STATUS-IMPACTO360.bat
```

Remover auto-start:

```bat
REMOVER-AUTO-START-IMPACTO360.bat
```

Depois de instalado, ao entrar no Windows, o Shopping Impacto 360 deve abrir automaticamente em:

```txt
http://localhost:5173
```

