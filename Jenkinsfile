pipeline {
    agent any

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    credentialsId: 'GITHUB_LOGIN',
                    url: 'https://github.com/fintrust/fintrust.git'
            }
        }

        stage('Run Backend Tests and Coverage') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                    sh 'npm run coverage'
                }
            }
        }

        stage('Run SonarQube Analysis') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'SONAR_TOKEN',
                        variable: 'SONAR_TOKEN'
                    )
                ]) {
                    sh '''
                        docker run --rm \
                            -e SONAR_TOKEN="$SONAR_TOKEN" \
                            -v "$(pwd):/usr/src" \
                            sonarsource/sonar-scanner-cli \
                            -Dsonar.projectKey=frank-org_fintrust \
                            -Dsonar.organization=frank-org \
                            -Dsonar.sources=backend/src,frontend \
                            -Dsonar.tests=backend/test \
                            -Dsonar.javascript.lcov.reportPaths=backend/coverage/lcov.info \
                            -Dsonar.host.url=https://sonarcloud.io
                    '''
                }
            }
        }
    }
}