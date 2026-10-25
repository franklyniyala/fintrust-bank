pipeline {
    agent any

    stages {
        stage('Checkout Code') {
            steps {
                checkoutCode()
            }
        }

        stage('Run Sonarqube Analysis') {
            steps {
                runSonarScan()
            }
        }
    }
}

void checkoutCode() {
    git branch: 'main',
        credentialsId: 'GITHUB_LOGIN',
        url: 'https://github.com/fintrust/fintrust.git'
}

void runSonarScan() {
    withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
        sh '''
            docker run --rm \
                -e SONAR_TOKEN=$SONAR_TOKEN \
                -v $(pwd):/usr/src \
                sonarsource/sonar-scanner-cli \
                -Dsonar.projectKey=frank-org_fintrust \
                -Dsonar.organization=frank-org \
                -Dsonar.sources=. \
                -Dsonar.host.url=https://sonarcloud.io
        '''
    }
}