import type { Metadata } from "next";
import { EMPRESA } from "@/lib/empresa";
import { RETENCAO } from "@/lib/retencao";

export const metadata: Metadata = { title: "Política de Privacidade", alternates: { canonical: "/privacidade" } };

const ATUALIZADA = "06/11/2026";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-stone-200 py-8">
      <h2 className="text-xl font-semibold tracking-tight">{titulo}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-stone-700 [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </section>
  );
}

/** Política de Privacidade (LGPD — Lei 13.709/2018) do site e do sistema da Artepinus. */
export default function PrivacidadePage() {
  const c = EMPRESA.contato;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-marca-700">LGPD · Lei 13.709/2018</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Política de Privacidade</h1>
      <p className="mt-3 text-sm text-stone-500">Atualizada em {ATUALIZADA}</p>
      <p className="mt-8 text-lg leading-relaxed text-stone-700">
        Esta política explica quais dados pessoais a {EMPRESA.razaoSocial} trata no seu site e no seu sistema interno, para quê, por quanto tempo e como você pode exercer os seus
        direitos.
      </p>

      <Secao titulo="Quem é o controlador">
        <p>
          {EMPRESA.razaoSocial}, CNPJ {EMPRESA.cnpj}, {c.endereco}, {c.cidade}. Telefone {c.telefone}
          {c.email ? ` · e-mail ${c.email}` : ""}.
        </p>
      </Secao>

      <Secao titulo="Site institucional">
        <p>
          O site não tem formulários, não pede cadastro e não usa cookies de publicidade ou de rastreamento. Os servidores registram dados técnicos de acesso (como endereço IP e
          navegador) apenas para segurança e funcionamento.
        </p>
        <p>
          A página de rastreabilidade aberta pelo QR Code das etiquetas mostra apenas dados do produto (origem florestal, datas de produção, secagem e expedição), sem nomes de
          clientes, funcionários ou motoristas.
        </p>
      </Secao>

      <Secao titulo="Sistema interno (colaboradores)">
        <p>Para os colaboradores com acesso ao sistema, tratamos:</p>
        <ul>
          <li>Nome, login, perfil de acesso e senha (guardada de forma irreversível, nunca em texto);</li>
          <li>Pergunta de segurança e a resposta (também guardada de forma irreversível), se você cadastrar;</li>
          <li>Registros de uso: quem lançou ou alterou cada informação, quando e, nos acessos, de qual endereço IP;</li>
          <li>Nome e placas de motoristas que fazem transporte de toras e de cargas;</li>
          <li>Dados de aparelho para avisos no celular, se você ativar as notificações.</li>
        </ul>
        <p>
          <b>Finalidades:</b> dar acesso ao sistema, controlar a produção, a rastreabilidade e a expedição, manter a segurança (inclusive o bloqueio de tentativas repetidas de
          senha) e registrar a responsabilidade por cada lançamento. <b>Bases legais:</b> execução do contrato de trabalho ou de prestação de serviço, cumprimento de obrigações
          legais e legítimo interesse da empresa na segurança e na organização da produção.
        </p>
      </Secao>

      <Secao titulo="Cookies e armazenamento no aparelho">
        <ul>
          <li>Cookie de sessão (essencial): mantém você conectado ao sistema; sem ele não é possível entrar.</li>
          <li>Preferências no próprio aparelho: tema claro/escuro e o último módulo usado.</li>
          <li>Lançamentos feitos sem internet ficam guardados no aparelho até serem enviados, e são apagados ao sair do sistema.</li>
        </ul>
      </Secao>

      <Secao titulo="Por quanto tempo guardamos">
        <ul>
          <li>Tentativas de login sem sucesso: {RETENCAO.tentativasDias} dia.</li>
          <li>Registros de entrada e saída do sistema (com IP): {RETENCAO.acessosDias} dias.</li>
          <li>Notificações já lidas: {RETENCAO.notificacoesLidasDias} dias.</li>
          <li>Registros de alterações (auditoria): {RETENCAO.auditoriaAnos} anos.</li>
          <li>Dados de produção, rastreabilidade e expedição: enquanto forem necessários à atividade e às obrigações legais e fiscais.</li>
          <li>Conta de usuário: enquanto houver vínculo; depois é desativada.</li>
        </ul>
        <p>A exclusão dos registros que passam do prazo é feita automaticamente, todos os dias.</p>
      </Secao>

      <Secao titulo="Com quem compartilhamos">
        <p>
          Os dados ficam em serviços de hospedagem e banco de dados contratados para operar o sistema, com acesso protegido. Não vendemos dados pessoais. Dados de expedição
          (romaneio e nota fiscal) são compartilhados com clientes e transportadores na medida necessária à entrega.
        </p>
      </Secao>

      <Secao titulo="Segurança">
        <p>
          Conexão criptografada (HTTPS), senhas guardadas de forma irreversível, limite de tentativas de senha, acesso por perfil e registro de todas as alterações. Ao trocar a
          senha, as sessões abertas em outros aparelhos são encerradas.
        </p>
      </Secao>

      <Secao titulo="Seus direitos">
        <p>
          Você pode pedir confirmação do tratamento, acesso, correção, anonimização ou eliminação de dados desnecessários, informações sobre compartilhamento e revisão de
          decisões, nos termos do art. 18 da LGPD. Fale com a empresa pelo telefone {c.telefone}
          {c.email ? ` ou pelo e-mail ${c.email}` : ""}, ou no endereço acima.
        </p>
      </Secao>
    </div>
  );
}
