# Kubernetes - Tarfin Prod
function kprod
    KUBECONFIG=~/.kube/tarfin-config command kubectl -n prod $argv
end

function k9sprod
    KUBECONFIG=~/.kube/tarfin-config command k9s -n prod $argv
end
