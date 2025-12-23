#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

readonly APP_NAME="webmail-launcher"
readonly INSTALL_DIR="${INSTALL_DIR:-$HOME/$APP_NAME}"
readonly REPO_URL="https://github.com/panie18/webmail_launcher"
readonly MIN_DOCKER_VERSION="20.10.0"
readonly MIN_COMPOSE_VERSION="2.0.0"

if [[ -t 1 ]]; then
    readonly RED='\033[0;31m'
    readonly GREEN='\033[0;32m'
    readonly YELLOW='\033[0;33m'
    readonly BLUE='\033[0;34m'
    readonly CYAN='\033[0;36m'
    readonly NC='\033[0m'
else
    readonly RED='' GREEN='' YELLOW='' BLUE='' CYAN='' NC=''
fi

log_info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

fail() {
    log_error "$*"
    exit 1
}

command_exists() {
    command -v "$1" &>/dev/null
}

version_gte() {
    printf '%s\n%s' "$2" "$1" | sort -V -C
}

print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║   ██╗    ██╗███████╗██████╗ ███╗   ███╗ █████╗ ██╗██╗       ║"
    echo "║   ██║    ██║██╔════╝██╔══██╗████╗ ████║██╔══██╗██║██║       ║"
    echo "║   ██║ █╗ ██║█████╗  ██████╔╝██╔████╔██║███████║██║██║       ║"
    echo "║   ██║███╗██║██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══██║██║██║       ║"
    echo "║   ╚███╔███╔╝███████╗██████╔╝██║ ╚═╝ ██║██║  ██║██║███████╗  ║"
    echo "║    ╚══╝╚══╝ ╚══════╝╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚══════╝  ║"
    echo "║                      LAUNCHER                                ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

detect_environment() {
    log_info "Detecting environment..."
    IS_UMBREL=false
    IS_ROOT=false
    DETECTED_OS="linux"
    if [[ -d "/umbrel" ]] || [[ -f "/umbrel/umbrel" ]] || [[ -d "$HOME/umbrel" ]]; then
        IS_UMBREL=true
        log_info "Detected: ${GREEN}Umbrel OS${NC}"
    fi
    if [[ "$OSTYPE" == "darwin"* ]]; then
        DETECTED_OS="macos"
        log_info "Detected: ${GREEN}macOS${NC}"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        DETECTED_OS="linux"
        if [[ -f /etc/os-release ]]; then
            . /etc/os-release
            log_info "Detected: ${GREEN}$NAME${NC}"
        fi
    fi
    if [[ $EUID -eq 0 ]]; then
        IS_ROOT=true
        log_warn "Running as root is not recommended"
    fi
}

check_requirements() {
    log_info "Checking requirements..."
    if ! command_exists docker; then
        fail "Docker is not installed"
    fi
    local docker_version
    docker_version=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "0.0.0")
    if ! version_gte "$docker_version" "$MIN_DOCKER_VERSION"; then
        fail "Docker version $MIN_DOCKER_VERSION required (found: $docker_version)"
    fi
    log_success "Docker $docker_version"
    
    if command_exists docker-compose; then
        local compose_version
        compose_version=$(docker-compose version --short 2>/dev/null || echo "0.0.0")
        log_success "Docker Compose $compose_version (docker-compose)"
        COMPOSE_CMD="docker-compose"
    elif docker compose version &>/dev/null 2>&1; then
        local compose_version
        compose_version=$(docker compose version --short 2>/dev/null || echo "0.0.0")
        log_success "Docker Compose $compose_version (docker compose)"
        COMPOSE_CMD="docker compose"
    else
        fail "Docker Compose is not installed"
    fi
    HAS_GIT=false
    if command_exists git; then
        HAS_GIT=true
        log_success "git available"
    fi
}

setup_directories() {
    log_info "Setting up directories..."
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$INSTALL_DIR/docker/secrets"
    mkdir -p "$INSTALL_DIR/data"
    mkdir -p "$INSTALL_DIR/data/snappymail"
    mkdir -p "$INSTALL_DIR/data/roundcube"
    chmod 700 "$INSTALL_DIR/docker/secrets"
    log_success "Directories created"
}

generate_secrets() {
    log_info "Generating secrets..."
    local encryption_key_file="$INSTALL_DIR/docker/secrets/encryption_key"
    local jwt_secret_file="$INSTALL_DIR/docker/secrets/jwt_secret"
    if [[ ! -f "$encryption_key_file" ]]; then
        head -c 32 /dev/urandom | base64 > "$encryption_key_file"
        chmod 600 "$encryption_key_file"
        log_success "Encryption key generated"
    fi
    if [[ ! -f "$jwt_secret_file" ]]; then
        head -c 64 /dev/urandom | base64 > "$jwt_secret_file"
        chmod 600 "$jwt_secret_file"
        log_success "JWT secret generated"
    fi
}

download_application() {
    log_info "Downloading application..."
    cd "$INSTALL_DIR"
    if [[ "$HAS_GIT" == true ]]; then
        if [[ -d ".git" ]]; then
            git pull --quiet 2>/dev/null || true
        else
            git clone --depth 1 "$REPO_URL.git" "$INSTALL_DIR/tmp_clone" 2>/dev/null || true
            if [[ -d "$INSTALL_DIR/tmp_clone" ]]; then
                cp -r "$INSTALL_DIR/tmp_clone"/* "$INSTALL_DIR/" 2>/dev/null || true
                rm -rf "$INSTALL_DIR/tmp_clone"
            fi
        fi
    else
        curl -fsSL "$REPO_URL/archive/refs/heads/main.tar.gz" | tar -xz --strip-components=1
    fi
    log_success "Application downloaded"
}

create_env_file() {
    log_info "Creating configuration..."
    local env_file="$INSTALL_DIR/.env"
    if [[ -f "$env_file" ]]; then
        return
    fi
    local app_port="3000"
    if [[ "$IS_UMBREL" == true ]]; then
        app_port="3847"
    fi
    cat > "$env_file" << EOF
NODE_ENV=production
PORT=${app_port}
DATABASE_PATH=/data/webmail.db
ENCRYPTION_KEY_FILE=/run/secrets/encryption_key
JWT_SECRET_FILE=/run/secrets/jwt_secret
SESSION_TIMEOUT=3600000
TOKEN_EXPIRY=300
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
SNAPPYMAIL_URL=http://webmail-snappymail:8888
ROUNDCUBE_URL=http://webmail-roundcube:80
EOF
    chmod 600 "$env_file"
    log_success "Configuration created"
}

start_containers() {
    log_info "Starting containers..."
    cd "$INSTALL_DIR"
    export PORT="${PORT:-3000}"
    $COMPOSE_CMD pull --quiet 2>/dev/null || true
    $COMPOSE_CMD up -d --build
    log_success "Containers started"
}

wait_for_health() {
    log_info "Waiting for application..."
    local max_attempts=60
    local attempt=0
    local port="${PORT:-3000}"
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -sf "http://localhost:$port/api/health" &>/dev/null; then
            log_success "Application ready!"
            return 0
        fi
        ((attempt++))
        sleep 2
    done
    log_warn "Health check timed out"
}

print_success() {
    local port="${PORT:-3000}"
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     ✓ Webmail Launcher installed successfully!           ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  Access: ${BLUE}http://localhost:$port${NC}"
    echo ""
    echo -e "  Commands:"
    echo -e "    Logs:    ${YELLOW}cd $INSTALL_DIR && docker compose logs -f${NC}"
    echo -e "    Stop:    ${YELLOW}cd $INSTALL_DIR && docker compose down${NC}"
    echo -e "    Update:  ${YELLOW}cd $INSTALL_DIR && ./scripts/install.sh${NC}"
    echo ""
}

main() {
    print_banner
    detect_environment
    check_requirements
    setup_directories
    generate_secrets
    download_application
    create_env_file
    start_containers
    wait_for_health
    print_success
}

main "$@"
